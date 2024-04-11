use rand::random;
use rocket::{http::Status, request::{FromRequest, Outcome}, response::status::BadRequest, serde::{Deserialize, Serialize}, Request};
use sha2::{Digest, Sha256};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct H256(primitive_types::H256);

impl H256 {
    pub fn rnd() -> Self {
        Self(primitive_types::H256(random()))
    }

    pub fn from_str(s: &str) -> Self {
        let mut hash = Sha256::new();
        hash.update(s);
        Self(primitive_types::H256(hash.finalize().into()))
    }

    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        let mut b = [0u8; 32];
        hex::decode_to_slice(h, &mut b).map_err(|e| BadRequest(format!("Wrong hex string: {e:?}")))?;
        Ok(Self(primitive_types::H256(b)))
    }

    pub fn hash(&self) -> Self {
        let mut h = Sha256::new();
        h.update(self.0);
        Self(primitive_types::H256(h.finalize().into()))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct Secret(H256);
impl Secret {
    pub fn rnd() -> Self {
        Self(H256::rnd())
    }

    pub fn from_str(s: &str) -> Self {
        Self(H256::from_str(s))
    }

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
    pub fn from_str(s: &str) -> Self {
        Self(H256::from_str(s))
    }

    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        Ok(Self(H256::from_hex(h)?))
    }
}
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct QuizID(H256);
impl QuizID {
    pub fn rnd() -> Self {
        Self(H256::rnd())
    }

    pub fn from_str(s: &str) -> Self {
        Self(H256::from_str(s))
    }

    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        Ok(Self(H256::from_hex(h)?))
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq, Hash)]
#[serde(crate = "rocket::serde")]
pub struct CourseID(H256);
impl CourseID {
    pub fn rnd() -> Self {
        Self(H256::rnd())
    }

    pub fn from_str(s: &str) -> Self {
        Self(H256::from_str(s))
    }

    pub fn from_hex(h: &str) -> Result<Self, BadRequest<String>> {
        Ok(Self(H256::from_hex(h)?))
    }
}

