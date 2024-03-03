# Livequiz

This is a very simple livequiz based on MD files with a live view of what the students answer.
It allows to send a link to students, who can answer questions.
The admin view shows all students, and what they answered already.

# TODO

- admin view:
    - add statistics to each column of how many answered correctly
    - automatically update view every few seconds
- student view:
    - store the answers in the local storage for later retrieval
    - add a switch so that students directly see if they answered correctly or not
    - when results are shown, show the chosen and the correct result
- general
    - add a quiz-id, so that students only see their results
    - admin can upload quizzes
    - admin can choose which quizz is shown
- backend
    - store user data on disk
- modes
    - exam mode: only once the admin switch is flicked will the students see if they answered correctly
    - live mode: after every question, students see if they answered correctly
        - updatable: students can update their questions

# CHANGELOG

2024-03-03:
- backend: store quizzes on disk
- backend: get the quiz from the backend instead of having it in the frontend:
- admin_view: "show results" actually works: only if it's enabled should the correct answers be shown
- first version with frontend and backend
