use rocket::{
    response::status::BadRequest,
    serde::{Deserialize, Serialize},
};
use sled::Db;
use std::collections::HashMap;

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
        _user: UserID,
        list: UpdateRequest,
    ) -> Result<UpdateReply, BadRequest<String>> {
        let mut reply = UpdateReply {
            nomad_data: HashMap::new(),
        };
        for (id_str, entry) in list.nomad_versions {
            let id = H256::from_hex(&id_str)?;
            match self.get(&id).await {
                Ok(Some(j)) => {
                    if entry.version == 0 || j.version > entry.version {
                        println!("Returning entry with version {}", j.version);
                        reply.nomad_data.insert(id_str, j);
                    } else if entry.version > j.version {
                        println!("Adding entry with version {}", j.version);
                        self.set(&id, &entry)
                            .await
                            .map_err(|e| BadRequest(e.to_string()))?;
                    }
                }
                Ok(None) => {
                    println!("Adding new entry with version {}", entry.version);
                    self
                    .set(&id, &entry)
                    .await
                    .map_err(|e| BadRequest(e.to_string()))?},
                Err(_) => todo!(),
            }
        }
        Ok(reply)
    }

    pub fn reset(&self){
        self.tree.clear().expect("Clearing db");
    }

    async fn get(&self, key: &H256) -> Result<Option<UpdateEntry>, String> {
        if let Some(res) = self.tree.get(key.as_ref()).map_err(|e| e.to_string())? {
            let ret = std::str::from_utf8(&res)
                .map_err(|e| e.to_string())?
                .to_string();
            return Ok(Some(serde_json::from_str(&ret).unwrap()));
        }
        return Ok(None);
    }

    async fn set(&self, key: &H256, value: &UpdateEntry) -> Result<(), String> {
        self.tree
            .insert(
                key.as_ref(),
                serde_json::to_string(value)
                    .map_err(|e| e.to_string())?
                    .as_bytes(),
            )
            .map_err(|e| e.to_string())?;
        Ok(())
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
pub struct UpdateEntry {
    pub version: u32,
    pub json: Option<String>,
}

#[cfg(test)]
mod test {
    use std::error::Error;
    use tempfile::tempdir;

    use super::*;

    #[async_test]
    async fn test_set_get() -> Result<(), Box<dyn Error>> {
        let dir = tempdir()?;
        let path = dir.path().to_str().unwrap();
        let nomads = Nomads::new(path);
        let id = H256::rnd();
        let mut value = UpdateEntry {
            version: 2,
            json: Some("1234".into()),
        };
        nomads.set(&id, &value).await?;
        assert_eq!(Some(value.clone()), nomads.get(&id).await?);

        drop(nomads.tree);
        let nomads = Nomads::new(path);
        assert_eq!(Some(value.clone()), nomads.get(&id).await?);
        value.version = 3;
        nomads.set(&id, &value).await?;

        drop(nomads.tree);
        let nomads = Nomads::new(path);
        assert_eq!(Some(value.clone()), nomads.get(&id).await?);

        Ok(())
    }
}
