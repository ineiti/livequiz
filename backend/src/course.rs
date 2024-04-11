use crate::{ids::{CourseID, QuizID, UserID}, structs::{
    Choice, ChoiceMulti, ChoiceRegexp, Course, CourseConfig, CourseEnrolment, CourseState,
    Question, Quiz,
}};

impl Course {
    pub fn new(name: &str, admin: UserID) -> Self {
        Self {
            name: name.into(),
            id: CourseID::rnd(),
            config: CourseConfig {
                enrolment: CourseEnrolment::Open,
            },
            admins: vec![admin],
            students: vec![],
            quizzes: vec![],
            state: CourseState::Idle,
            results: vec![],
        }
    }

    pub fn add_admin(&mut self, admin: UserID, new_admin: UserID) {
        if self.admins.contains(&admin) {
            self.admins.push(new_admin);
        }
    }

    pub fn add_student(&mut self, student: UserID) {
        if self.config.enrolment == CourseEnrolment::Open {
            self.students.push(student);
        }
    }

    pub fn add_student_registered(&mut self, admin: UserID, student: UserID) {
        if self.admins.contains(&admin) {
            self.students.push(student);
        }
    }

    pub fn add_quizz(&mut self, admin: UserID, quiz_str: &str) {
        if self.admins.contains(&admin) {
            if let Ok(quiz) = Quiz::new(quiz_str) {
                self.quizzes.push(quiz);
            }
        }
    }
}

impl Quiz {
    pub fn new(s: &str) -> Result<Self, String> {
        let mut lines = Lines::new(s);
        let mut quiz = Self {
            id: QuizID::rnd(),
            title: lines.get_first(true).ok_or("Empty quiz".to_string())?,
            questions: vec![],
        };
        while lines.0.len() > 0 {
            quiz.read_quiz(&mut lines)?;
        }
        Ok(quiz)
    }

    pub fn read_quiz(&mut self, lines: &mut Lines) -> Result<(), String> {
        if lines.0.len() == 0 {
            return Ok(());
        }
        let mut question = Question {
            title: Quiz::get_title(lines).ok_or("This should never happen...".to_string())?,
            intro: Quiz::get_intro(lines),
            choice: Quiz::get_choice(lines)?,
            explanation: Quiz::get_explanation(lines),
        };
        self.questions.push(question);
        Ok(())
    }

    fn get_title(lines: &mut Lines) -> Option<String> {
        lines.get_first(true)
    }

    fn get_intro(lines: &mut Lines) -> String {
        lines.collect_until_break("=~", true).join("\n")
    }

    fn get_choice(lines: &mut Lines) -> Result<Choice, String> {
        let mut choices = lines.collect_until_break("#", true);
        if choices.len() == 0 {
            return Err("Wrongly formatted question".into());
        }
        let mut line = choices[0].chars();
        match line.nth(0) {
            Some('=') => {
                let correct: usize =
                    line.skip(1).collect::<String>().parse().map_err(|e| {
                        format!("Error while parsing # of correct question: {:?}", e)
                    })?;
                if choices.len() < correct + 2 {
                    return Err("Not enough answers".into());
                }
                Ok(Choice::Multi(ChoiceMulti {
                    correct: choices[1..correct + 1]
                        .iter()
                        .map(|l| l.clone().split_off(2))
                        .collect(),
                    wrong: choices[correct + 1..]
                        .iter()
                        .map(|l| l.clone().split_off(2))
                        .collect(),
                }))
            }
            Some('~') => {
                let mut cr = ChoiceRegexp {
                    replace: vec![],
                    matches: vec![],
                };
                while choices.len() > 0 {
                    if let Some(c) = choices[0].chars().nth(0) {
                        if c == '~' {
                            cr.replace.push(choices[0].split_off(2));
                            choices.remove(0);
                        } else {
                            break;
                        }
                    } else {
                        choices.remove(0);
                    }
                }
                cr.matches
                    .append(&mut choices.iter().map(|l| l.clone().split_off(2)).collect());
                if cr.replace.len() == 0 || cr.matches.len() == 0 {
                    return Err("Faulty regexp choice".into());
                }
                Ok(Choice::Regexp(cr))
            }
            _ => Err("Wrongly formatted question".into()),
        }
    }

    fn get_explanation(lines: &mut Lines) -> Option<String> {
        let expl = lines.collect_until_break("#", false);
        (expl.len() > 0).then(|| expl.join("\n"))
    }
}

struct Lines(Vec<String>);

impl Lines {
    fn new(s: &str) -> Self {
        Self(s.split("\n").map(|s| s.to_string()).collect())
    }

    fn get_first(&mut self, cut: bool) -> Option<String> {
        self.skip_empty();
        if self.0.len() == 0 {
            return None;
        }

        let first = self.0.remove(0);
        if cut {
            if let Some((_, b)) = first.clone().split_once(' ') {
                return Some(b.into());
            }
        }
        Some(first.into())
    }

    fn skip_empty(&mut self) {
        while self.0.len() > 0 && self.0[0].len() == 0 {
            self.0.remove(0);
        }
    }

    fn collect_until_break(&mut self, brk: &str, brk_empty: bool) -> Vec<String> {
        let mut res = vec![];

        self.skip_empty();

        'collect: while self.0.len() > 0 {
            let mut chars = self.0[0].chars();
            if let Some(c) = chars.nth(0) {
                for b in brk.chars() {
                    if c == b {
                        break 'collect;
                    }
                }
            } else if brk_empty {
                break 'collect;
            }
            if let Some(s) = self.get_first(false) {
                res.push(s);
            }
        }

        res
    }
}

#[cfg(test)]

mod test {
    use std::error::Error;
    use crate::ids::Secret;

    use super::*;

    #[test]
    fn test_imp() {
        let admin_id = Secret::rnd().hash();
        let course = Course::new("1234", admin_id.clone());
        let course2 = Course::new("1234", admin_id);
        assert_eq!(course.id, course2.id);
    }

    fn test_one(
        input: &str,
        title: &str,
        info: &str,
        choice: &Choice,
        expl: &Option<String>,
    ) -> Result<(), String> {
        test_one_line(&mut Lines::new(input), title, info, choice, expl)
    }

    fn test_one_line(
        l: &mut Lines,
        title: &str,
        info: &str,
        choice: &Choice,
        expl: &Option<String>,
    ) -> Result<(), String> {
        assert_eq!(title, &Quiz::get_title(l).unwrap());
        assert_eq!(info, &Quiz::get_intro(l));
        assert_eq!(choice, &Quiz::get_choice(l)?);
        assert_eq!(expl, &Quiz::get_explanation(l));
        Ok(())
    }

    #[test]
    fn test_read_quiz() -> Result<(), Box<dyn Error>> {
        let title_str = "# Title\n";
        let title = Quiz::get_title(&mut Lines::new(title_str)).unwrap();
        assert_eq!("Title", &title);
        let intro_str = "intro1\nintro2\n";
        let intro = Quiz::get_intro(&mut Lines::new(intro_str));
        assert_eq!("intro1\nintro2", &intro);
        let choice_str = "= 2\n- one\n- two\n- three\n";
        let choice = Quiz::get_choice(&mut Lines::new(choice_str))?;
        assert_eq!(
            Choice::Multi(ChoiceMulti {
                correct: vec!["one".to_string(), "two".to_string()],
                wrong: vec!["three".to_string()]
            }),
            choice
        );
        let regexp_str = "~ s/one/two/g\n~ s/two/three/\n- /one/\n- /two/\n";
        let regexp = Quiz::get_choice(&mut Lines::new(regexp_str))?;
        assert_eq!(
            Choice::Regexp(ChoiceRegexp {
                replace: vec!["s/one/two/g".to_string(), "s/two/three/".to_string()],
                matches: vec!["/one/".to_string(), "/two/".to_string()]
            }),
            regexp
        );
        let expl_str = "some\nexplanation\n";
        let expl = Quiz::get_explanation(&mut Lines::new(expl_str));
        assert_eq!(Some("some\nexplanation".to_string()), expl);

        test_one(
            &format!("{title_str}{choice_str}"),
            &title,
            "",
            &choice,
            &None,
        )?;
        test_one(
            &format!("{title_str}{intro_str}{choice_str}\n{expl_str}"),
            &title,
            &intro,
            &choice,
            &expl,
        )?;

        let mut l = Lines::new(&format!(
            "{title_str}{intro_str}{choice_str}{title_str}{choice_str}"
        ));
        test_one_line(&mut l, &title, &intro, &choice, &None)?;
        test_one_line(&mut l, &title, "", &choice, &None)?;

        let mut l = Lines::new(&format!(
            "{title_str}{intro_str}{choice_str}\n{expl_str}{title_str}{choice_str}"
        ));
        test_one_line(&mut l, &title, &intro, &choice, &expl)?;
        test_one_line(&mut l, &title, "", &choice, &None)?;
        Ok(())
    }
}
