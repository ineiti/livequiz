import { Injectable } from '@angular/core';
import { MatSelectionList } from "@angular/material/list";
import { Question, Questionnaire, QuestionnaireService } from './questionnaire.service';
import { UserService } from './user.service';
import { ReplaySubject } from 'rxjs';
import { ConnectionService, Result, ResultState } from './connection.service';

export class QuizResult {
  description = "undefined";
  title = "undefined";
  maxChoices = 0;
  choices: string[] = [""];
  selected: boolean[] = [];
  hint = "";
  result: ResultState = "empty";
  correct: number[] = [];

  constructor(cq: Question, index: number, choices: Result[]) {
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
export class QuizResultsService {
  questionnaire = new Questionnaire("");
  empty = true;
  first = false;
  last = false;
  currentQuestion = 0;
  results: Result[] = [];

  private _answer?: QuizResult;
  answer: ReplaySubject<QuizResult> = new ReplaySubject();

  constructor(private qservice: QuestionnaireService,
    private connection: ConnectionService) {
    qservice.loaded.subscribe((q) => {
      this.questionnaire = q;
      this.results = [];
      this.connection.getResults().then((res) => this.updateResults(res));
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

  updateResults(res: Result[]){
    this.results = res;
  }

  update() {
    this.first = this.currentQuestion === 0;
    this.empty = this.questionnaire.questions.length === 0;
    if (!this.empty) {
      this.last = this.currentQuestion === this.questionnaire.questions.length - 1;
      this.updateAnswer();
    }
  }

  updateAnswer() {
    const cq = this.questionnaire.questions[this.currentQuestion];
    this._answer = new QuizResult(cq, this.results[this.currentQuestion]);
    this.answer.next(this._answer!);
  }
}
