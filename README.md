# Livequiz

This is a very simple livequiz based on MD files which describe exercices.
You can define courses which have any number of quizzes.
Then you can send the link of the course to your students, which can:
- fill out the active quiz in the _dojo_
- choose to train on their own as a _kata_

You can either run it on your own server using the `docker-compose.yaml` file,
or use the publicly available [Livequiz](https://livequiz.fledg.re) on the
upcoming [Fledger](https://web.fledg.re) platform.

![](https://github.com/ineiti/livequiz_example/blob/main/example.gif?raw=true)

## Dojo

The quiz presented in the dojo is chosen by the admin.
Once the quiz is active, the admin can view the results in
with the `Show Progress` button.
This overview shows all students and which questions they already answered.

Once the time is over, or enough students answered, the teacher can
choose to `Start Corrections`.
This puts the dojo in read mode, and the students cannot change their
answers anymore.
They will also see the corrections directly in their browser.

In the admin view, the questions are ordered by failure: those with the
highest failure rate come first, followed by the questions with a better
passing grade.
This allows the teacher to go over the most difficult questions and explain
them once more.

## Kata

Students can also choose a quiz to be done on their own.
When they choose `Train` next to a quiz, they see the same view as with a `dojo`,
but now they can choose on their own when they want to see the results.

# Design choices

## Cheating

This software does not do anything special to avoid cheating.
It supposes that the students want to check what they learnt during the course.
But if they want to cheat, it's very easy: they can just choose `Train` and then
switch to corrections.

## Frontend / Backend

It uses a very simple backend written in Rust using the Rocket-framework.
There is only one API-call: `nomadUpdates`

### Nomads

I'm proud of the implementation of `Nomads`, which are javascript-objects
that are automatically synchronized with the server and the clients.
This simplifies the architecture of the system a lot:
the backend is only used to synchronize the data, while the frontends do all the
interpretation and updating of the data.

### Fledger

The use of Nomads preceeds using the [Fledger](https://web.fledg.re) distributed
system, where users can share bandwidth, storage, and CPU in a fair way.
This will mean that you won't have to care about a server, as long as you're willing
to let your browser run and serve data to other people's browsers.

## Authentication

When loading the page for the first time, it generates a random token and stores it
in the `localStorage` of the browser.
Currently it stores the hash of this random token in the Nomads to represent property
of the Nomads.
If you lose your token, there is no way of recovering it, as the server only stores the
hash of your token.

## Quiz Syntax

A file with two exercices looks like this:

```md
# Iptables questions

## Default tables

Which of the following tables exist by default in `iptables`?

= 3
- nat
- mangle
- filter
- mac

There is no `mac` table by default in `iptables`.

## Default action

Type the command to define a default action which drops all output traffic
in the `nat` table.

~ s/ +/ /g
~ s/^ +//
- iptables -t nat -P OUTPUT DROP

It would not be correct do add a rule to drop all traffic at the end of the
rule list like this: `iptables -t nat -A OUTPUT -j DROP`. This does not
describe a default action. Also, you cannot add other rules with `-A` after
this command.
```

This defines a quiz `Iptables questions` with two questions.
The first question is a multiple-choice question with 3 correct choices.
For multiple-choice questions, the correct questions always come first, followed
by the wrong questions.
The frontend will present them in a random order to the students.

The second question is a regexp-question.
The `~ s/ +/ /g` line makes sure that all multi-spaces get reduced to a single space.
The following removes all leading space, even though this is not needed here.
The third line defines a string that the user must enter.
As the string is not enclosed by `^` and `$`, it will ignore leading and trailing characters.

Multiple-choices with `= 1` are presented with a radio button.
The explanation after the question is optional.
You can either upload a file, or you can edit it directly in the quiz.

# Run your own

If you want to run your own instance, you can simply use the `docker-compose.yaml` file
for installation and use the pre-compiled docker image:

```bash
wget https://raw.githubusercontent.com/ineiti/livequiz/main/docker-compose.yaml
docker compose pull
docker compose up -d
```

This opens the port 8000 for you.

If you have a `traefik` installation, the second part of the `docker-compose.yaml` has
a configuration which works on my setup. YMMV.
If you choose to use the traefik-labels, you can remove the `ports` part.

# Development

If you want to help develop the system, you're very welcome to do so.
I use `devbox` for the development environment.
You can start the backend and the frontend with the following commands:

```bash
devbox run backend &
devbox run frontend
```

Then you can connect to http://localhost:4200 to start using it.

Please feel free to send PRs to https://github.com/ineiti/livequiz

# License

This software is licensed under AGPL-3.0 or later, at your convenience.

# TODO v2

- bugs:
  - corrections
    - order is still buggy with db_240523
    - even in reverse order, the result is not satisfactory
    - when called with course/id/corrections, all fields are green
    - even when clicking directly on "corrections" the first time, it shows all green.
  - ui
    - on mobile devices, long answers are hidden partially
  - stats
    - when all values are 0, it doesn't show nicely
- features
  - propose link with `/recover#secret`
  - visit old dojos
  - add other user to owner of course
  - show stats for 7 / 14 / 31 days
  - get all quizzes from a github repo
    - enter the name of a github / gitlab 
  - compatibility with Delibay - probably difficult
  - add "delete" button to clean students
  - modes
    - groups of students for race

# CHANGELOG

2024-05-28:
- recover user with a `/recover#secret` path

2024-05-23:
- regroup wrong answers in regexps
- when changing quiz for dojo, got the previous quiz in the dojo multiple times
- twice quiz name in corrections

2024-05-19:
- add statistics
- show statistics
- statistics are not shown anymore if switched to a tab and back

2024-05-17:
- fixed: update of quiz during dojo doesn't work
- new user starting a dojo is not signed up to course - and has wrong message
- ui
  - buttons in course overview are not hidden in bottom bar
  - bottom bar is too high

2024-05-16:
- authentication: only allow changes to Nomads by the owner...
  - change owner to owner: UserID[] to allow for more than one owner.

2024-05-13:
- Added LICENSE
- Updated README

2024-05-07:
- update quizzes
- re-arrange quizzes

2024-05-06:
- edit quizzes
- certains boutons ne sont pas visibles

2024-05-03:
- self-chosen quizzes

2024-05-02:
- rewrite of backend
- more general frontend, with possibility for other admins

2024-03-21:
- don't reset choices in multi
- correction: add number of answers for choices
- correction: fix several wrong calculations of choices

2024-03-20:
- add questions which are verified with regular expressions
  - use `~` instead of `=`, followed by the regular expression for search and replace
  - more than one `-` is allowed, and any matching regex solves the question
- fix small bugs in `/corrections`

2024-03-14:
- add statistics to each column of how many answered correctly
- like student view, but show the answers with the least success first

2024-03-12:
- admin: automatically update view every few seconds
- frontend: use rxjs to propagate state changes like quizState (showResult, frozen, ...) and studentAnswers (for admin)
- add a quiz-id, so that students only see their results
- show number of answers needed

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

Download and launch the docker-compose.yml :

```bash
wget https://raw.githubusercontent.com/ineiti/livequiz/main/docker-compose.yaml
docker compose pull
docker compose up -d
```

Now you can point your browser to http://localhost:8000 and start using it.
If you install it on your server and use traefik, there are some labels to
get you started.
At least they worked for me :)

# Acknowledgements

Thanks a lot to the Network Security Class 2024 of [HEIG/VD](https://heig-vd.ch/) for their
(un)voluntarily beta-testing of the app.
I hope you enjoyed it as much as I did :)