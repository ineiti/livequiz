# Livequiz

This is a very simple livequiz based on MD files with a live view of what the students answer.
It allows to send a link to students, who can answer questions.
The admin view shows all students, and what they answered already.

# TODO

- bugs:
  - l'interface admin peut "perdre" des noms après le redémarrage du système
- admin view:
  - route to /student if it's not an admin
  - add statistics to each column of how many answered correctly
  - like student view, but show the answers with the least success first
- student view:
  - show green and red in numbers when showResults === true
  - show number of answers needed
- general
  - admin can upload quizzes
  - admin can choose which quizz is shown
  - add questions which are verified with regular expressions
    - use `~` instead of `=` and `-`, followed by the regular expression
    - remove double spaces, leading and trailing spaces
    - more than one `~` is allowed, and any matching regex solves the question
    - The preferred solution is given as string after the first `~`
  - modes
    - exam mode: only once the admin switch is flicked will the students see if they answered correctly
    - live mode: after every question, students see if they answered correctly
      - updatable: students can update their questions
    - modes are a combination of switches:
      - students directly see if they answered correctly or not
      - stop students from changing their answers
- backend
  - store user data on disk

# CHANGELOG

2024-03-12:
- admin: automatically update view every few seconds
- frontend: use rxjs to propagate state changes like quizState (showResult, frozen, ...) and studentAnswers (for admin)
- add a quiz-id, so that students only see their results

2024-03-07:
- admin: 0 a 12, students: 1 a 13
- footer peut cacher les points
- footer with copyright and link to github
- student automatically updates with 'showView'

2024-03-06:
- added first real questionnaires

2024-03-04:
- add docker-compose.yaml with Dockerfile

2024-03-03:
- student_view: when results are shown, show the chosen and the correct result
- student_view: store the answers in the local storage for later retrieval
- backend: store quizzes on disk
- backend: get the quiz from the backend instead of having it in the frontend:
- admin_view: "show results" actually works: only if it's enabled should the correct answers be shown
- first version with frontend and backend

# Installation

Launch the docker-compose.yml