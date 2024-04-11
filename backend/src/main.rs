use std::env;

use rocket::fs::FileServer;
use rocket::http::Header;
use rocket::response::status::BadRequest;
use rocket::serde::json::Json;
use rocket::{Build, Request, Response, Rocket, State};

mod course;
mod ids;
mod storage;
mod structs;
use ids::{CourseID, Secret, UserID};
use structs::{Course, Quiz};

#[macro_use]
extern crate rocket;

#[put("/v2/users", data = "<name>")]
async fn update_name(
    users: &State<Users>,
    secret: Secret,
    name: &str,
) -> Result<(), BadRequest<String>> {
    users.put(secret.hash(), name).await;
    Ok(())
}

#[post("/v2/courses", data = "<name>")]
async fn create_course(courses: &State<Courses>, secret: Secret, name: &str) -> Json<Course> {
    Json(courses.create(name, secret.hash()).await)
}

#[get("/v2/courses")]
async fn list_courses(courses: &State<Courses>, secret: Secret) -> Json<Vec<Course>> {
    Json(courses.list(secret.hash()).await)
}

#[put("/v2/courses/<course_id>/admins", data = "<new_admin>")]
async fn add_admin(
    courses: &State<Courses>,
    secret: Secret,
    course_id: &str,
    new_admin: &str,
) -> Result<(), BadRequest<String>> {
    courses
        .add_admin(
            CourseID::from_hex(course_id)?,
            secret.hash(),
            UserID::from_hex(new_admin)?,
        )
        .await
}

#[post("/v2/courses/<course_id>/quizzes", data = "<quiz>")]
async fn create_quiz(
    courses: &State<Courses>,
    secret: Secret,
    course_id: &str,
    quiz: &str,
) -> Result<Json<Quiz>, BadRequest<String>> {
    Ok(Json(
        courses
            .create_quiz(CourseID::from_hex(course_id)?, secret.hash(), quiz)
            .await,
    ))
}

#[launch]
async fn rocket() -> Rocket<Build> {
    let rb = rocket::build()
        .attach(CORS)
        .mount(
            "/api",
            routes![
                update_name,
                create_course,
                list_courses,
                add_admin,
                create_quiz
            ],
        )
        .manage(Users::new());

    if let Ok(web) = env::var("STATIC_PAGE") {
        rb.mount("/student", FileServer::from(web.clone()).rank(10))
            .mount("/admin", FileServer::from(web.clone()).rank(9))
            .mount("/", FileServer::from(web.clone()).rank(8))
    } else {
        rb
    }
}

use rocket::fairing::{Fairing, Info, Kind};

use crate::storage::{Courses, Users};

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
            "POST, PUT, GET, PATCH, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

#[cfg(test)]
mod test {}
