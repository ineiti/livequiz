use rocket::{
    http::Status,
    request::{FromRequest, Outcome},
    response::status::BadRequest,
    tokio::sync::Mutex,
    Request,
};
use std::collections::{BTreeMap, HashMap};

use crate::{
    ids::{CourseID, Secret, UserID},
    structs::{Course, Quiz},
};

pub struct Users {
    list: Mutex<BTreeMap<UserID, String>>,
}

impl Users {
    pub fn new() -> Self {
        Self {
            list: Mutex::new(BTreeMap::new()),
        }
    }
    pub async fn put(&self, id: UserID, name: &str) {
        let mut list = self.list.lock().await;
        list.entry(id)
            .and_modify(|u| *u = name.to_string())
            .or_insert_with(|| name.to_string());
    }
}

pub struct Courses {
    list: Mutex<HashMap<CourseID, Course>>,
}

impl Courses {
    pub async fn create(&self, name: &str, admin: UserID) -> Course {
        let mut list = self.list.lock().await;
        let course = Course::new(name, admin);
        list.insert(course.id.clone(), course.clone());
        course
    }

    pub async fn list(&self, user: UserID) -> Vec<Course> {
        let list = self.list.lock().await;
        list.iter()
            .filter(|(_, c)| {
                c.admins.contains(&user) || c.students.contains(&user)
            })
            .map(|(_, c)| c.clone())
            .collect()
    }

    pub async fn add_admin(
        &self,
        course: CourseID,
        admin: UserID,
        new_admin: UserID,
    ) -> Result<(), BadRequest<String>> {
        let mut list = self.list.lock().await;
        match list.get_mut(&course) {
            Some(c) => Ok(c.add_admin(admin, new_admin)),
            None => Err(BadRequest(format!("This course doesn't exist"))),
        }
    }

    pub async fn create_quiz(&self, course: CourseID, admin: UserID, quiz: &str) -> Quiz {
        todo!()
    }
}
