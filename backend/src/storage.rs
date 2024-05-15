use rocket::{
    response::status::BadRequest,
    serde::{Deserialize, Serialize},
};
use sled::Db;
use std::{
    collections::HashMap,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::ids::{UserID, H256};

pub struct Nomads {
    tree: Db,
}

impl Nomads {
    pub fn new(filename: &str) -> Self {
        Self {
            tree: sled::open(filename).expect("open"),
        }
    }

    pub async fn get_updates(
        &self,
        user: &UserID,
        list: UpdateRequest,
    ) -> Result<UpdateReply, BadRequest<String>> {
        let mut reply = UpdateReply {
            nomad_data: HashMap::new(),
        };
        for (id_str, remote) in list.nomad_versions {
            let id = H256::from_hex(&id_str)?;
            match self.get(&id).await {
                Ok(Some(stored)) => {
                    if remote.version == 0 || stored.version > remote.version {
                        reply.nomad_data.insert(id_str, stored);
                    } else if remote.version > stored.version
                        && stored.owner.as_ref().unwrap_or(user) == user
                    {
                        self.set(&id, remote)
                            .await
                            .map_err(|e| BadRequest(e.to_string()))?;
                    }
                }
                Ok(None) => self
                    .set(&id, remote)
                    .await
                    .map_err(|e| BadRequest(e.to_string()))?,
                Err(_) => todo!(),
            }
        }
        Ok(reply)
    }

    pub fn reset(&self) {
        self.tree.clear().expect("Clearing db");
    }

    async fn get(&self, key: &H256) -> Result<Option<UpdateEntry>, String> {
        if let Some(mut latest) = self.get_raw(key).await? {
            let now = Self::get_now();
            latest.time_last_read = now;
            self.set_raw(key, latest.clone()).await?;
            return Ok(Some(latest));
        }
        return Ok(None);
    }

    async fn get_raw(&self, key: &H256) -> Result<Option<UpdateEntry>, String> {
        if let Some(res) = self.tree.get(key.as_ref()).map_err(|e| e.to_string())? {
            let ret = std::str::from_utf8(&res)
                .map_err(|e| e.to_string())?
                .to_string();
            if let Ok(ue) = serde_json::from_str::<UpdateEntryVersions>(&ret) {
                return Ok(Some(ue.to_latest()));
            }
            // The first db didn't have the version identifiers
            if let Ok(ue0) = serde_json::from_str::<UpdateEntryV0>(&ret) {
                return Ok(Some(UpdateEntryVersions::V0(ue0).to_latest()));
            }
        }
        return Ok(None);
    }

    async fn set(&self, key: &H256, mut value: UpdateEntry) -> Result<(), String> {
        if let Some(stored) = self.get_raw(key).await? {
            value.time_created = stored.time_created;
            value.time_last_read = stored.time_last_read;
        }
        value.time_last_updated = Self::get_now();
        self.set_raw(key, value).await
    }

    async fn set_raw(&self, key: &H256, value: UpdateEntry) -> Result<(), String> {
        self.tree
            .insert(
                key.as_ref(),
                serde_json::to_string(&UpdateEntryVersions::V1(value))
                    .map_err(|e| e.to_string())?
                    .as_bytes(),
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn get_now() -> u64 {
        let start = SystemTime::now();
        let since_the_epoch = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");
        return since_the_epoch.as_millis() as u64;
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(crate = "rocket::serde")]
pub struct UpdateRequest {
    #[serde(rename = "nomadVersions")]
    pub nomad_versions: HashMap<String, UpdateEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(crate = "rocket::serde")]
pub struct UpdateReply {
    #[serde(rename = "nomadData")]
    pub nomad_data: HashMap<String, UpdateEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum UpdateEntryVersions {
    V0(UpdateEntryV0),
    V1(UpdateEntry),
}

impl UpdateEntryVersions {
    fn to_latest(self) -> UpdateEntry {
        match self {
            UpdateEntryVersions::V0(old) => UpdateEntry {
                owner: None,
                time_created: Nomads::get_now(),
                time_last_updated: Nomads::get_now(),
                time_last_read: Nomads::get_now(),
                version: old.version,
                json: old.json,
            },
            UpdateEntryVersions::V1(ue) => ue,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct UpdateEntryV0 {
    pub version: u32,
    pub json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct UpdateEntry {
    pub owner: Option<UserID>,
    pub version: u32,
    pub json: Option<String>,
    // TODO: use the timing fields to decide which entries to remove if the db gets
    // too big.
    pub time_created: u64,
    pub time_last_updated: u64,
    pub time_last_read: u64,
}

#[cfg(test)]
mod test {
    use std::error::Error;
    use tempfile::{tempdir, TempDir};

    use super::*;

    impl UpdateEntry {
        fn equal_some(&self, other: &Self) -> bool {
            return self.owner == other.owner
                && self.version == other.version
                && self.json == other.json
                && self.time_created == other.time_created;
        }
    }

    #[async_test]
    async fn test_set_get() -> Result<(), Box<dyn Error>> {
        let dir = tempdir()?;
        let path = dir.path().to_str().unwrap();
        let nomads = Nomads::new(path);
        let id = H256::rnd();
        let owner1 = UserID::rnd();
        let now = Nomads::get_now();
        let mut value = UpdateEntry {
            version: 2,
            json: Some("1234".into()),
            owner: Some(owner1),
            time_created: now,
            time_last_updated: now,
            time_last_read: now,
        };
        nomads.set(&id, value.clone()).await?;
        assert!(value.equal_some(&nomads.get(&id).await?.unwrap()));

        drop(nomads.tree);
        let nomads = Nomads::new(path);
        assert!(value.equal_some(&nomads.get(&id).await?.unwrap()));
        value.version = 3;
        nomads.set(&id, value.clone()).await?;

        drop(nomads.tree);
        let nomads = Nomads::new(path);
        assert!(value.equal_some(&nomads.get(&id).await?.unwrap()));

        println!(
            "json: {}",
            serde_json::to_string(&value).expect("serialize")
        );

        Ok(())
    }

    struct SetOwner {
        dir: TempDir,
        nomads: Nomads,
        id: H256,
        user: UserID,
        now: u64,
        value: UpdateEntry,
        request: UpdateRequest,
    }

    impl SetOwner {
        fn new() -> Self {
            let dir = tempdir().unwrap();
            let now = Nomads::get_now();
            let mut request = UpdateRequest {
                nomad_versions: HashMap::new(),
            };
            let id = H256::rnd();
            let value = UpdateEntry {
                version: 2,
                json: Some("1234".into()),
                owner: None,
                time_created: now,
                time_last_updated: now,
                time_last_read: now,
            };
            request.nomad_versions.insert(id.to_hex(), value.clone());
            Self {
                nomads: Nomads::new(dir.path().to_str().unwrap()),
                user: UserID::rnd(),
                dir,
                now,
                request,
                id,
                value,
            }
        }

        async fn get_updates(
            &mut self,
            version: u32,
            json: Option<String>,
            owner: Option<UserID>,
        ) -> Result<UpdateReply, Box<dyn Error>> {
            let value = self
                .request
                .nomad_versions
                .get_mut(&self.id.to_hex())
                .unwrap();
            value.version = version;
            value.json = json;
            value.owner = owner;
            Ok(self
                .nomads
                .get_updates(&self.user, self.request.clone())
                .await
                .map_err(|e| e.0)?)
        }

        async fn read_json(&self) -> Result<String, Box<dyn Error>> {
            let mut val = self
                .request
                .nomad_versions
                .get(&self.id.to_hex())
                .unwrap()
                .clone();
            val.version = 0;
            let answer = self
                .nomads
                .get_updates(&self.user, self.request.clone())
                .await
                .map_err(|e| e.0)?;
            return Ok(answer
                .nomad_data
                .get(&self.id.to_hex())
                .unwrap()
                .json
                .as_ref()
                .unwrap()
                .to_string());
        }
    }

    #[async_test]
    async fn test_set_owner() -> Result<(), Box<dyn Error>> {
        let mut so = SetOwner::new();

        let answer = so.get_updates(2, Some("1234".into()), None).await?;
        assert_eq!(0, answer.nomad_data.len());
        assert_eq!("1234", &so.read_json().await?);

        let answer = so
            .get_updates(3, Some("3456".into()), Some(so.user.clone()))
            .await?;
        assert_eq!(0, answer.nomad_data.len());
        assert_eq!("3456", &so.read_json().await?);

        Ok(())
    }
}
