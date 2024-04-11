use rocket::serde::{Deserialize, Serialize};
use crate::ids::{CourseID, QuizID, UserID};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct Course {
    pub name: String,
    pub id: CourseID,
    pub config: CourseConfig,
    pub admins: Vec<UserID>,
    pub students: Vec<UserID>,
    pub quizzes: Vec<Quiz>,
    pub state: CourseState,
    pub results: Vec<DojoResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct CourseConfig {
    pub enrolment: CourseEnrolment,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum CourseEnrolment {
    Open,
    PreRegistered,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum CourseState {
    Idle,
    Quiz(QuizID),
    Corrections,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct Quiz {
    pub id: QuizID,
    pub title: String,
    pub questions: Vec<Question>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct Question {
    pub title: String,
    pub intro: String,
    pub choice: Choice,
    pub explanation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum Choice {
    Multi(ChoiceMulti),
    Regexp(ChoiceRegexp),
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct ChoiceMulti {
    pub correct: Vec<String>,
    pub wrong: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct ChoiceRegexp {
    pub replace: Vec<String>,
    pub matches: Vec<String>,
}

pub struct DojoResults {
    pub quiz_id: QuizID,
    pub results: Vec<DojoResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub struct DojoResult {
    pub user: UserID,
    pub choices: Vec<DojoChoice>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Ord, Eq)]
#[serde(crate = "rocket::serde")]
pub enum DojoChoice {
    Multi(Vec<usize>),
    Regexp(String),
}
