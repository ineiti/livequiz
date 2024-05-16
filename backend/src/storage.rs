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
                        reply.nomad_data.insert(id_str, stored.into());
                    } else if remote.version > stored.version {
                        if stored.owner.as_ref().unwrap_or(user) == user {
                            println!(
                                "{:.8} Updates {:.8}: {:?}",
                                user.to_hex(),
                                id.to_hex(),
                                remote
                            );
                            self.set(&id, remote.try_into()?)
                                .await
                                .map_err(|e| BadRequest(e.to_string()))?;
                        } else {
                            reply.nomad_data.insert(id_str, stored.into());
                            println!(
                                "{:.8} is not owner of {:.8}, so not updating {:?}",
                                user.to_hex(),
                                id.to_hex(),
                                remote
                            );
                        }
                    }
                }
                Ok(None) => {
                    println!(
                        "{:.8} Creates {:.8}: {:?}",
                        user.to_hex(),
                        id.to_hex(),
                        remote
                    );
                    self.set(&id, remote.try_into()?)
                        .await
                        .map_err(|e| BadRequest(e.to_string()))?
                }
                Err(_) => todo!(),
            }
        }
        Ok(reply)
    }

    pub fn reset(&self) {
        self.tree.clear().expect("Clearing db");
    }

    async fn get(&self, key: &H256) -> Result<Option<Entry>, String> {
        if let Some(mut latest) = self.get_raw(key).await? {
            let now = Self::get_now();
            latest.time_last_read = now;
            self.set_raw(key, latest.clone()).await?;
            return Ok(Some(latest));
        }
        return Ok(None);
    }

    async fn get_raw(&self, key: &H256) -> Result<Option<Entry>, String> {
        if let Some(res) = self.tree.get(key.as_ref()).map_err(|e| e.to_string())? {
            let ret = std::str::from_utf8(&res)
                .map_err(|e| e.to_string())?
                .to_string();
            if let Ok(ue) = serde_json::from_str::<EntryVersions>(&ret) {
                return Ok(Some(ue.to_latest()));
            }
            // The first db didn't have the version identifiers
            if let Ok(ue0) = serde_json::from_str::<EntryV0>(&ret) {
                return Ok(Some(EntryVersions::V0(ue0).to_latest()));
            }
        }
        return Ok(None);
    }

    async fn set(&self, key: &H256, mut value: Entry) -> Result<(), String> {
        if let Some(stored) = self.get_raw(key).await? {
            value.time_created = stored.time_created;
            value.time_last_read = stored.time_last_read;
        }
        value.time_last_updated = Self::get_now();
        self.set_raw(key, value).await
    }

    async fn set_raw(&self, key: &H256, value: Entry) -> Result<(), String> {
        self.tree
            .insert(
                key.as_ref(),
                serde_json::to_string(&EntryVersions::V1(value))
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
    pub nomad_versions: HashMap<String, SerdeEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(crate = "rocket::serde")]
pub struct UpdateReply {
    #[serde(rename = "nomadData")]
    pub nomad_data: HashMap<String, SerdeEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct SerdeEntry {
    pub owner: Option<UserID>,
    pub version: u32,
    pub json: Option<String>,
    pub time_created: Option<u64>,
    pub time_last_updated: Option<u64>,
    pub time_last_read: Option<u64>,
}

impl From<Entry> for SerdeEntry {
    fn from(value: Entry) -> Self {
        Self {
            owner: value.owner,
            version: value.version,
            json: value.json,
            time_created: Some(value.time_created),
            time_last_updated: Some(value.time_last_updated),
            time_last_read: Some(value.time_last_read),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum EntryVersions {
    V0(EntryV0),
    V1(Entry),
}

impl EntryVersions {
    fn to_latest(self) -> Entry {
        match self {
            EntryVersions::V0(old) => Entry {
                owner: None,
                time_created: Nomads::get_now(),
                time_last_updated: Nomads::get_now(),
                time_last_read: Nomads::get_now(),
                version: old.version,
                json: old.json,
            },
            EntryVersions::V1(ue) => ue,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct EntryV0 {
    pub version: u32,
    pub json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct Entry {
    pub owner: Option<UserID>,
    pub version: u32,
    pub json: Option<String>,
    // TODO: use the timing fields to decide which entries to remove if the db gets
    // too big.
    pub time_created: u64,
    pub time_last_updated: u64,
    pub time_last_read: u64,
}

impl TryFrom<SerdeEntry> for Entry {
    type Error = BadRequest<String>;

    fn try_from(value: SerdeEntry) -> Result<Self, Self::Error> {
        if value.time_created.is_none()
            || value.time_last_read.is_none()
            || value.time_last_updated.is_none()
        {
            return Err(BadRequest("missing time values".into()));
        }
        if value.json.is_none() {
            return Err(BadRequest("missing json value".into()));
        }
        Ok(Self {
            owner: value.owner,
            version: value.version,
            json: value.json,
            time_created: value.time_created.unwrap(),
            time_last_updated: value.time_last_updated.unwrap(),
            time_last_read: value.time_last_read.unwrap(),
        })
    }
}

#[cfg(test)]
mod test {
    use std::error::Error;
    use tempfile::tempdir;

    use super::*;

    impl Nomads {
        async fn set_raw_v0(&self, key: &H256, value: EntryV0) -> Result<(), String> {
            self.tree
                .insert(
                    key.as_ref(),
                    serde_json::to_string(&value)
                        .map_err(|e| e.to_string())?
                        .as_bytes(),
                )
                .map_err(|e| e.to_string())?;
            Ok(())
        }
    }

    impl Entry {
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
        let mut value = Entry {
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

        Ok(())
    }

    struct SetOwner {
        nomads: Nomads,
        id: H256,
        user: UserID,
        value: Entry,
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
            let value = Entry {
                version: 2,
                json: Some("1234".into()),
                owner: None,
                time_created: now,
                time_last_updated: now,
                time_last_read: now,
            };
            request
                .nomad_versions
                .insert(id.to_hex(), value.clone().into());
            Self {
                nomads: Nomads::new(dir.path().to_str().unwrap()),
                user: UserID::rnd(),
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
            self.value.version = version;
            self.value.json = json;
            self.value.owner = owner;
            self.request
                .nomad_versions
                .insert(self.id.to_hex(), self.value.clone().into());
            Ok(self
                .nomads
                .get_updates(&self.user, self.request.clone())
                .await
                .map_err(|e| e.0)?)
        }

        async fn get_ue(&mut self) -> Result<Entry, Box<dyn Error>> {
            let mut answer = self.get_updates(0, None, None).await?;
            Ok(answer
                .nomad_data
                .remove(&self.id.to_hex())
                .unwrap()
                .try_into()
                .map_err(|_| "wrong type")?)
        }

        async fn read_json(&mut self) -> Result<String, Box<dyn Error>> {
            return Ok(self.get_ue().await?.json.as_ref().unwrap().to_string());
        }
    }

    #[async_test]
    async fn test_update() -> Result<(), Box<dyn Error>> {
        let so = SetOwner::new();
        so.nomads
            .set_raw_v0(
                &so.id,
                EntryV0 {
                    version: 1,
                    json: Some("1234".into()),
                },
            )
            .await?;
        let ue = so.nomads.get_raw(&so.id).await?.unwrap();
        assert_eq!(1, ue.version);
        assert_eq!("1234", ue.json.unwrap());
        Ok(())
    }

    #[async_test]
    async fn test_set_owner() -> Result<(), Box<dyn Error>> {
        let mut so = SetOwner::new();
        let user2 = UserID::rnd();

        let answer = so.get_updates(2, Some("1234".into()), None).await?;
        assert_eq!(0, answer.nomad_data.len());
        assert_eq!("1234", &so.read_json().await?);

        // Allow setting of owner
        let answer = so
            .get_updates(3, Some("3456".into()), Some(user2.clone()))
            .await?;
        assert_eq!(0, answer.nomad_data.len());
        let ue = so.get_ue().await?;
        assert!(ue.owner.unwrap().eq(&user2));
        assert_eq!("3456", ue.json.unwrap());

        // Refuse overwriting of owner
        let answer = so.get_updates(4, None, Some(so.user.clone())).await?;
        assert_eq!(0, answer.nomad_data.len());
        let ue = so.get_ue().await?;
        assert!(ue.owner.unwrap().eq(&user2));

        // Refuse updating by non-owner
        let answer = so.get_updates(4, Some("5678".into()), None).await?;
        assert_eq!(0, answer.nomad_data.len());
        let ue = so.get_ue().await?;
        assert!(ue.owner.unwrap().eq(&user2));

        // Allow updating by owner
        so.user = user2.clone();
        let answer = so.get_updates(4, Some("5678".into()), None).await?;
        assert_eq!(0, answer.nomad_data.len());
        assert_eq!("5678", so.read_json().await?);

        // Allow updating of owner by owner
        let user3 = UserID::rnd();
        let answer = so.get_updates(5, None, Some(user3.clone())).await?;
        assert_eq!(0, answer.nomad_data.len());
        let ue = so.get_ue().await?;
        assert!(ue.owner.unwrap().eq(&user3));

        Ok(())
    }
}
