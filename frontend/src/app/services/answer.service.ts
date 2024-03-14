import { Injectable } from '@angular/core';
import { MatSelectionList } from "@angular/material/list";
import { Question, Questionnaire, QuestionnaireService } from './questionnaire.service';
import { UserService } from './user.service';
import { ReplaySubject } from 'rxjs';
import { ResultState } from './connection.service';

export class Answer {
  description = "undefined";
  title = "undefined";
  maxChoices = 0;
  choices: string[] = [""];
  selected: boolean[] = [];
  hint = "";
  result: ResultState = "empty";
  correct: number[] = [];

  constructor(cq: Question, selected: boolean[]) {
    this.description = cq.description;
    this.maxChoices = cq.maxChoices;
    this.choices = cq.choices;
    this.selected = selected;
    this.result = cq.resultShuffled(this.selected);
    this.hint = cq.hint;
    this.title = cq.title;
    this.correct = cq.correct();
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnswerService {
  questionnaire = new Questionnaire("");
  done: boolean[] = [];
  empty = true;
  percentage = 100;
  first = false;
  last = false;
  currentQuestion = 0;

  private _answer?: Answer;
  answer: ReplaySubject<Answer> = new ReplaySubject();

  constructor(private qservice: QuestionnaireService, private user: UserService) {
    qservice.loaded.subscribe((q) => {
      this.questionnaire = q.clone();
      this.questionnaire.shuffle();
      this.done = q.questions.map((_) => false);
      this.update();
    });
  }

  next() {
    this.goto(this.currentQuestion + 1);
  }

  previous() {
    this.goto(this.currentQuestion - 1);
  }

  goto(q: number) {
    if (q >= 0 && q < this.questionnaire.questions.length) {
      this.currentQuestion = q;
      this.update();
    }
  }

  updateSelection(event: MatSelectionList) {
    const selected = event.selectedOptions.selected.length;
    const maxChoices = this._answer!.maxChoices;
    if (selected > maxChoices) {
      event.selectedOptions.selected[0].toggle();
    } else {
      this.done[this.currentQuestion] = selected === maxChoices;
    }
    this.user.updateSelections(this.currentQuestion,
      this._answer!.selected.map((_, i) => {
        return event.selectedOptions.selected.some((sel) => sel.value === i);
      }));
    this.updateAnswer();
  }

  update() {
    this.first = this.currentQuestion === 0;
    this.empty = this.questionnaire.questions.length === 0;
    if (!this.empty) {
      this.last = this.currentQuestion === this.questionnaire.questions.length - 1;
      this.percentage = 100 * (this.currentQuestion + 1) / this.questionnaire.questions.length;
      this.updateAnswer();
    }
  }

  updateAnswer() {
    const cq = this.questionnaire.questions[this.currentQuestion];
    const selected = this.user.getSelections(this.currentQuestion);
    this._answer = new Answer(cq, selected);
    this.answer.next(this._answer);
  }
}
