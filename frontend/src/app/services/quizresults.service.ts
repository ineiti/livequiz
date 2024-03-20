import { Injectable } from '@angular/core';
import { MatSelectionList } from "@angular/material/list";
import { Question, Questionnaire, QuestionnaireService } from './questionnaire.service';
import { UserService } from './user.service';
import { ReplaySubject, Subscription } from 'rxjs';
import { ConnectionService, Result, ResultState } from './connection.service';

export interface ChoicesStats {
  field: string;
  stats: number;
}

export class QuizResult {
  description = "undefined";
  title = "undefined";
  maxChoices = 0;
  choices: ChoicesStats[] = [];
  hint = "";
  score = 0;
  index = -1;

  constructor(cq: Question, index: number, choices: Result[]) {
    this.index = index;
    this.description = cq.description;
    this.maxChoices = cq.maxChoices;
    this.hint = cq.hint;
    this.title = cq.title;
    const choicesFiltered = choices
      .filter((choice) => choice.choices.length > index)
      .map((choice) => choice.choices[index]);
    this.score = choicesFiltered
      .map((s) => cq.score(s))
      .reduce((prev, cur) => prev + cur, 0)
      / choicesFiltered.length;
    const allChoices = cq.choices.map((c, i) => {
      const stats = choicesFiltered
        .filter((choice) => choice.includes(i)).length
        / choicesFiltered.length
      return { field: c, stats: stats };
    });
    const correctChoices = allChoices.slice(0, this.maxChoices);
    const wrongChoices = allChoices.slice(this.maxChoices);
    correctChoices.sort((a, b) => b.stats - a.stats);
    wrongChoices.sort((a, b) => a.stats - b.stats);
    this.choices = correctChoices.concat(wrongChoices);
  }

  static empty(): QuizResult {
    return new QuizResult(new Question(), 0, []);
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
  results: QuizResult[] = [];

  private _answer?: QuizResult;
  answer: ReplaySubject<QuizResult> = new ReplaySubject();
  done: ReplaySubject<boolean> = new ReplaySubject();

  constructor(private qservice: QuestionnaireService,
    private connection: ConnectionService) {
    this.qservice.loaded.subscribe((q) => {
      this.questionnaire = q.clone();
      this.results = [];
      this.connection.getResults().then((res) => {
        this.updateResults(res);
        this.update();
        this.done.next(true);
      });
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

  updateResults(res: Result[]) {
    this.results = this.questionnaire.questions
      .map((question, i) => new QuizResult(question, i, res));
    this.results.sort((a, b) => b.score - a.score);
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
    this.answer.next(this.results[this.currentQuestion]);
  }
}
