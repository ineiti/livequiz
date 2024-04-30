use std::collections::BTreeMap;
use std::env;

use rocket::fs::FileServer;
use rocket::http::Header;
use rocket::serde::Deserialize;
use rocket::serde::{json::Json, Serialize};
use rocket::tokio::fs;
use rocket::{tokio::sync::Mutex, State};
use rocket::{Build, Request, Response, Rocket};

#[macro_use]
extern crate rocket;

struct Users {
    list: Mutex<BTreeMap<String, User>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
struct User {
    secret: String,
    name: Option<String>,
    answers: Vec<String>,
    choices: Vec<Vec<usize>>,
}

impl User {
    fn update_selected(&mut self, pos: usize, res: String, choices: Vec<usize>) {
        if self.answers.len() <= pos {
            self.answers.resize(pos + 1, "empty".to_string())
        }
        if self.choices.len() <= pos {
            self.choices.resize(pos + 1, vec![])
        }
        self.answers[pos] = res;
        self.choices[pos] = choices;
    }

    fn new_with_selected(secret: String, pos: usize, res: String, choices: Vec<usize>) -> Self {
        let mut u = Self {
            secret,
            name: None,
            answers: vec!["empty".to_string(); pos + 1],
            choices: vec![vec![]; pos + 1],
        };
        u.answers[pos] = res;
        u.choices[pos] = choices;
        u
    }
}

#[get("/v1/updateName?<secret>&<name>")]
async fn update_name(users: &State<Users>, secret: String, name: String) -> &'static str {
    let mut list = users.list.lock().await;
    list.entry(secret.clone())
        .and_modify(|u| u.name = Some(name.clone()))
        .or_insert_with(|| User {
            secret: secret.clone(),
            name: Some(name.clone()),
            answers: vec![],
            choices: vec![],
        });
    "{}"
}

#[get("/v1/updateQuestion?<secret>&<question>&<selected>&<choices>")]
async fn update_question(
    users: &State<Users>,
    secret: String,
    question: usize,
    selected: String,
    choices: Vec<usize>,
) -> &'static str {
    let mut list = users.list.lock().await;
    list.entry(secret.clone())
        .and_modify(|u| u.update_selected(question, selected.clone(), choices.clone()))
        .or_insert_with(|| User::new_with_selected(secret, question, selected, choices));
    "{}"
}

#[get("/v1/getResults")]
async fn get_results(users: &State<Users>) -> Json<Vec<User>> {
    let list = users.list.lock().await;
    Json(list.values().cloned().collect())
}

#[derive(Debug)]
struct Config {
    questionnaire: Mutex<String>,
    admin_secret: String,
    show_answers: Mutex<bool>,
    edit_allowed: Mutex<bool>,
}

const CONFIG_QUESTIONNAIRE_STRING: &str = "QUESTIONNAIRE_STRING";
const CONFIG_QUESTIONNAIRE: &str = "QUESTIONNAIRE";
const CONFIG_ADMIN_SECRET: &str = "ADMIN_SECRET";

impl Config {
    pub async fn new() -> Self {
        let questionnaire = Mutex::new(Self::get_questionnaire().await);
        Self {
            questionnaire,
            admin_secret: env::var(CONFIG_ADMIN_SECRET)
                .expect(&format!("Need '{CONFIG_ADMIN_SECRET}'")),
            show_answers: Mutex::new(false),
            edit_allowed: Mutex::new(true),
        }
    }

    async fn update_questionnaire(&self) {
        *self.questionnaire.lock().await = Self::get_questionnaire().await;
    }

    async fn get_questionnaire() -> String {
        if let Ok(q) = env::var(CONFIG_QUESTIONNAIRE_STRING) {
            return q;
        }
        fs::read_to_string(env::var(CONFIG_QUESTIONNAIRE).expect(&format!(
            "Need '{CONFIG_QUESTIONNAIRE}' environment variable"
        )))
        .await
        .expect("Couldn't read file")
    }
}

#[get("/v1/getQuestionnaire")]
async fn get_questionnaire(config: &State<Config>) -> String {
    config.questionnaire.lock().await.clone()
}

#[get("/v1/getIsAdmin?<secret>")]
async fn get_is_admin(config: &State<Config>, secret: String) -> Json<bool> {
    Json(config.admin_secret == secret)
}

#[get("/v1/setShowAnswers?<secret>&<show>")]
async fn set_show_answers(config: &State<Config>, secret: String, show: String) {
    if config.admin_secret == secret {
        *config.show_answers.lock().await = show == "true";
    } else {
        println!("Wrong secret");
    }
}

#[get("/v1/setEditAllowed?<secret>&<edit>")]
async fn set_edit_allowed(config: &State<Config>, secret: String, edit: String) {
    if config.admin_secret == secret {
        *config.edit_allowed.lock().await = edit == "true";
    } else {
        println!("Wrong secret");
    }
}

#[get("/v1/updateQuestionnaire?<secret>")]
async fn update_questionnaire(config: &State<Config>, secret: String) {
    if config.admin_secret == secret {
        config.update_questionnaire().await;
        println!("New questionnaire: {}", *config.questionnaire.lock().await)
    } else {
        println!("Wrong secret");
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
struct Stats {
    #[serde(rename = "showResults")]
    show_results: bool,
    #[serde(rename = "editAllowed")]
    edit_allowed: bool,
    #[serde(rename = "quizHash")]
    quiz_hash: String,
    #[serde(rename = "answersHash")]
    answers_hash: String,
}

impl Stats {
    pub async fn new(config: &State<Config>, users: &State<Users>) -> Stats {
        let mut quiz_hash = Sha256::new();
        quiz_hash.update((config.questionnaire.lock().await).as_bytes());
        let mut answers_hash = Sha256::new();
        let users_m = users.list.lock().await;
        for (_, user) in &*users_m {
            answers_hash.update(&user.secret);
            if let Some(u) = &user.name {
                answers_hash.update(u);
            }
            for answer in &user.answers {
                answers_hash.update(answer);
            }
            for choice in &user.choices {
                let mut choice_sort = choice.clone();
                choice_sort.sort();
                for c in choice_sort {
                    answers_hash.update(c.to_ne_bytes());
                }
            }
        }
        Stats {
            show_results: *config.show_answers.lock().await,
            edit_allowed: *config.edit_allowed.lock().await,
            quiz_hash: format!("{:x}", quiz_hash.finalize()),
            answers_hash: format!("{:x}", answers_hash.finalize()),
        }
    }
}

#[get("/v1/getStats")]
async fn get_stats(config: &State<Config>, users: &State<Users>) -> Json<Stats> {
    let s = Stats::new(config, users).await;
    Json(s)
}

#[launch]
async fn rocket() -> Rocket<Build> {
    let rb = rocket::build()
        .attach(CORS)
        .mount(
            "/api",
            v1_routes(),
        )
        .manage(Users {
            list: Mutex::new(BTreeMap::new()),
        })
        .manage(Config::new().await);

    if let Ok(web) = env::var("STATIC_PAGE") {
        rb.mount("/student", FileServer::from(web.clone()).rank(10))
            .mount("/admin", FileServer::from(web.clone()).rank(9))
            .mount("/", FileServer::from(web.clone()).rank(8))
    } else {
        rb
    }
}

use rocket::fairing::{Fairing, Info, Kind};
use sha2::{Digest, Sha256};

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
    use rocket::local::asynchronous::{Client, LocalResponse};

    use super::*;

    struct TestClient {
        c: Client,
    }

    const QUESTIONNAIRE_TEST: &str =
        "# Test Questions\n\n## Q1\nQuestion\n=1\n- choice1\n- choice2\n## End";
    const ADMIN_SECRET: &str = "1234";

    impl TestClient {
        async fn new() -> Self {
            env::set_var(CONFIG_QUESTIONNAIRE_STRING, QUESTIONNAIRE_TEST);
            env::set_var(CONFIG_ADMIN_SECRET, ADMIN_SECRET);
            Self {
                c: Client::tracked(rocket().await)
                    .await
                    .expect("valid rocket instance"),
            }
        }

        async fn update_name(&self, secret: &str, name: &str) -> LocalResponse {
            self.c
                .get(format!(
                    "/api/v1/updateName?secret={}&name={}",
                    secret, name
                ))
                .dispatch()
                .await
        }

        async fn update_question(
            &self,
            secret: &str,
            question: usize,
            selected: &str,
        ) -> LocalResponse {
            self.c
                .get(format!(
                    "/api/v1/updateQuestion?secret={}&question={}&selected={}",
                    secret, question, selected
                ))
                .dispatch()
                .await
        }

        async fn get_results(&self) -> Vec<User> {
            self.c
                .get("/api/v1/getResults")
                .dispatch()
                .await
                .into_json()
                .await
                .expect("Expected JSON")
        }

        async fn get_stats(&self) -> Stats {
            self.c
                .get("/api/v1/getStats")
                .dispatch()
                .await
                .into_json()
                .await
                .expect("Expected JSON")
        }

        async fn get_questionnaire(&self) -> String {
            self.c
                .get("/api/v1/getQuestionnaire")
                .dispatch()
                .await
                .into_string()
                .await
                .expect("No questionnaire")
        }

        async fn set_show_answers(&self, secret: String, show: String) {
            self.c
                .get(&format!(
                    "/api/v1/setShowAnswers?secret={}&show={}",
                    secret, show
                ))
                .dispatch()
                .await;
        }

        async fn set_edit_allowed(&self, secret: String, edit: String) {
            self.c
                .get(&format!(
                    "/api/v1/setEditAllowed?secret={}&edit={}",
                    secret, edit
                ))
                .dispatch()
                .await;
        }
    }

    #[async_test]
    async fn test_add_name() {
        let client = TestClient::new().await;
        let mut user1 = User {
            secret: ADMIN_SECRET.to_string(),
            name: Some("foo".to_string()),
            answers: vec![],
            choices: vec![],
        };
        assert_eq!(
            200,
            client
                .update_name(&user1.secret, user1.name.as_ref().unwrap())
                .await
                .status()
                .code
        );
        assert_eq!(vec![user1.clone()], client.get_results().await);
        user1.name = Some("bar".to_string());
        assert_eq!(
            200,
            client
                .update_name(&user1.secret, user1.name.as_ref().unwrap())
                .await
                .status()
                .code
        );
        assert_eq!(vec![user1.clone()], client.get_results().await);

        let user2 = User {
            secret: "1235".to_string(),
            name: Some("foobar".to_string()),
            answers: vec![],
            choices: vec![],
        };
        assert_eq!(
            200,
            client
                .update_name(&user2.secret, user2.name.as_ref().unwrap())
                .await
                .status()
                .code
        );
        let mut users = client.get_results().await;
        users.sort();
        assert_eq!(vec![user1, user2], users);
    }

    #[async_test]
    async fn test_update_question() {
        let client = TestClient::new().await;
        let mut user = User {
            secret: ADMIN_SECRET.to_string(),
            name: Some("foo".to_string()),
            answers: vec!["empty".to_string(), "correct".to_string()],
            choices: vec![],
        };
        client
            .update_name(&user.secret, &user.name.as_ref().unwrap())
            .await;
        client
            .update_question(&user.secret, 1, &user.answers[1])
            .await;
        assert_eq!(vec![user.clone()], client.get_results().await);
        user.answers.insert(2, "correct".to_string());
        client
            .update_question(&user.secret, 2, &user.answers[2])
            .await;
        assert_eq!(vec![user], client.get_results().await);
    }

    #[async_test]
    async fn test_questionnaire() {
        let client = TestClient::new().await;
        assert_eq!(client.get_questionnaire().await, QUESTIONNAIRE_TEST);
    }

    #[async_test]
    async fn test_show_answers() {
        let client = TestClient::new().await;
        assert_eq!(false, client.get_stats().await.show_results);
        client
            .set_show_answers("12".to_string(), "true".to_string())
            .await;
        assert_eq!(false, client.get_stats().await.show_results);
        client
            .set_show_answers(ADMIN_SECRET.to_string(), "true".to_string())
            .await;
        assert_eq!(true, client.get_stats().await.show_results);
    }

    #[async_test]
    async fn test_get_stats() {
        let client = TestClient::new().await;
        let ah1 = client.get_stats().await.answers_hash;
        client
            .update_question(ADMIN_SECRET.into(), 0, "answered")
            .await;
        let ah2 = client.get_stats().await.answers_hash;
        assert_ne!(ah1, ah2);
    }
}
