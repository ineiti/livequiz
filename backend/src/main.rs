use std::collections::HashMap;

use rocket::http::Header;
use rocket::serde::Deserialize;
use rocket::serde::{json::Json, Serialize};
use rocket::{tokio::sync::Mutex, State};
use rocket::{Request, Response};

#[macro_use]
extern crate rocket;

struct Users {
    list: Mutex<HashMap<String, User>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
struct User {
    secret: String,
    name: Option<String>,
    answers: Vec<String>,
}

impl User {
    fn update_selected(&mut self, pos: usize, sel: String) {
        if self.answers.len() <= pos {
            self.answers.resize(pos + 1, "empty".to_string())
        }
        self.answers[pos] = sel;
    }

    fn new_with_selected(secret: String, pos: usize, sel: String) -> Self {
        let mut u = Self {
            secret,
            name: None,
            answers: vec!["empty".to_string(); pos],
        };
        u.answers[pos] = sel;
        u
    }
}

#[get("/api/v1/updateName?<secret>&<name>")]
async fn update_name(users: &State<Users>, secret: String, name: String) -> &'static str {
    let mut list = users.list.lock().await;
    list.entry(secret.clone())
        .and_modify(|u| u.name = Some(name.clone()))
        .or_insert_with(|| User {
            secret: secret.clone(),
            name: Some(name.clone()),
            answers: vec![],
        });
    println!("List is {list:?}");
    "{}"
}

#[get("/api/v1/updateQuestion?<secret>&<question>&<selected>")]
async fn update_question(
    users: &State<Users>,
    secret: String,
    question: usize,
    selected: String,
) -> &'static str {
    let mut list = users.list.lock().await;
    list.entry(secret.clone())
        .and_modify(|u| u.update_selected(question, selected.clone()))
        .or_insert_with(|| User::new_with_selected(secret, question, selected));
    println!("List is {list:?}");
    "{}"
}

#[get("/api/v1/getResults")]
async fn get_results(users: &State<Users>) -> Json<Vec<User>> {
    let list = users.list.lock().await;
    println!("List is {list:?}");
    Json(list.values().cloned().collect())
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(CORS)
        .mount("/", routes![update_name, update_question, get_results])
        .manage(Users {
            list: Mutex::new(HashMap::new()),
        })
}

use rocket::fairing::{Fairing, Info, Kind};

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, PATCH, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

#[cfg(test)]
mod test {
    use rocket::local::blocking::{Client, LocalResponse};

    use super::*;

    struct TestClient {
        c: Client,
    }

    impl TestClient {
        fn new() -> Self {
            Self {
                c: Client::tracked(rocket()).expect("valid rocket instance"),
            }
        }

        fn update_name(&self, secret: &str, name: &str) -> LocalResponse {
            self.c
                .get(format!(
                    "/api/v1/updateName?secret={}&name={}",
                    secret, name
                ))
                .dispatch()
        }

        fn update_question(
            &self,
            secret: &str,
            question: usize,
            selected: &str,
        ) -> LocalResponse {
            self.c
                .get(format!(
                    "/api/v1/updateQuestion?secret={}&question={}&selected={}",
                    secret,
                    question,
                    selected
                ))
                .dispatch()
        }

        fn get_results(&self) -> Vec<User> {
            self.c
                .get("/api/v1/getResults")
                .dispatch()
                .into_json()
                .expect("Expected JSON")
        }
    }

    #[test]
    fn test_add_name() {
        let client = TestClient::new();
        let mut user1 = User {
            secret: "1234".to_string(),
            name: Some("foo".to_string()),
            answers: vec![],
        };
        assert_eq!(
            200,
            client
                .update_name(&user1.secret, user1.name.as_ref().unwrap())
                .status()
                .code
        );
        assert_eq!(vec![user1.clone()], client.get_results());
        user1.name = Some("bar".to_string());
        assert_eq!(
            200,
            client
                .update_name(&user1.secret, user1.name.as_ref().unwrap())
                .status()
                .code
        );
        assert_eq!(vec![user1.clone()], client.get_results());

        let user2 = User {
            secret: "1235".to_string(),
            name: Some("foobar".to_string()),
            answers: vec![],
        };
        assert_eq!(
            200,
            client
                .update_name(&user2.secret, user2.name.as_ref().unwrap())
                .status()
                .code
        );
        let mut users = client.get_results();
        users.sort();
        assert_eq!(vec![user1, user2], users);
    }

    #[test]
    fn test_update_question() {
        let client = TestClient::new();
        let mut user = User {
            secret: "1234".to_string(),
            name: Some("foo".to_string()),
            answers: vec!["empty".to_string(), "correct".to_string()],
        };
        client.update_name(&user.secret, &user.name.as_ref().unwrap());
        client.update_question(&user.secret, 1, &user.answers[1]);
        assert_eq!(vec![user.clone()], client.get_results());
        user.answers.insert(2, "correct".to_string());
        client.update_question(&user.secret, 2, &user.answers[2]);
        assert_eq!(vec![user], client.get_results());
    }
}
