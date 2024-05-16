use rocket::{
    http::Status,
    request::{FromRequest, Outcome},
    response::status::BadRequest,
    serde::{Deserialize, Deserializer, Serialize, Serializer},
    Request,
};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
pub struct H256(primitive_types::H256);

impl H256 {
    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        let mut b = [0u8; 32];
        hex::decode_to_slice(h, &mut b)
            .map_err(|e| BadRequest(format!("Wrong hex string: {e:?}")))?;
        Ok(Self(primitive_types::H256(b)))
    }

    pub fn hash(&self) -> Self {
        let mut h = Sha256::new();
        h.update(self.0);
        Self(primitive_types::H256(h.finalize().into()))
    }

    pub fn as_ref(&self) -> &primitive_types::H256 {
        &self.0
    }

    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }
}

impl Serialize for H256 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_hex())
    }
}

impl<'de> Deserialize<'de> for H256 {
    fn deserialize<D>(deserializer: D) -> Result<H256, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: &str = Deserialize::deserialize(deserializer)?;
        H256::from_hex(s).map_err(|e| rocket::serde::de::Error::custom(e.0))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct Secret(H256);
impl Secret {
    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        Ok(Self(H256::from_hex(h)?))
    }

    pub fn hash(&self) -> UserID {
        UserID(self.0.hash())
    }
}

#[derive(Debug)]
pub enum ApiKeyError {
    Missing,
    Invalid,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Secret {
    type Error = ApiKeyError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match req.headers().get_one("x-secret-key") {
            None => Outcome::Error((Status::BadRequest, ApiKeyError::Missing)),
            Some(key) => match Secret::from_hex(key) {
                Ok(sec) => Outcome::Success(sec),
                Err(_) => Outcome::Error((Status::BadRequest, ApiKeyError::Invalid)),
            },
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct UserID(H256);

impl UserID {
    pub fn to_hex(&self) -> String {
        return self.0.to_hex();
    }
}

impl From<&H256> for UserID {
    fn from(value: &H256) -> Self {
        Self(value.clone())
    }
}

#[cfg(test)]
mod test {
    use rand::random;
    use std::error::Error;

    use super::*;

    impl H256 {
        pub fn rnd() -> Self {
            Self(primitive_types::H256(random()))
        }
    }

    impl UserID {
        pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
            Ok(Self(H256::from_hex(h)?))
        }

        pub fn rnd() -> Self {
            Self(H256::rnd())
        }
    }

    #[test]
    fn to_hex() -> Result<(), Box<dyn Error>> {
        let value = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        let a = UserID::from_hex(value).map_err(|_| "".to_string())?;
        let b = a.0.to_hex();
        assert_eq!(value, &b);
        Ok(())
    }
}
