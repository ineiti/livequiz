import { Injectable } from '@angular/core';
import { MatSelectionList } from "@angular/material/list";
import { ConnectionService } from './connection.service';
import { Questionnaire, QuestionnaireService } from './questionnaire.service';
import { ResultState } from '../../lib/connection';
import { UserService } from './user.service';

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

  // This is for the current question
  description = "undefined";
  title = "undefined";
  maxChoices = 0;
  choices: string[] = [""];
  selected: boolean[] = [];
  hint = "";
  result: ResultState = "empty";
  correct: number[] = [];

  constructor(private qservice: QuestionnaireService, private user: UserService) {
    qservice.loaded.subscribe((q) => {
      this.questionnaire = q;
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
      this.user.updateSelections(this.currentQuestion, this.selected);
      this.currentQuestion = q;
      this.update();
    }
  }

  updateSelection(event: MatSelectionList) {
    const selected = event.selectedOptions.selected.length;
    if (selected > this.maxChoices) {
      event.selectedOptions.selected[0].toggle();
    } else if (selected === this.maxChoices) {
      this.done[this.currentQuestion] = true;
    } else if (selected < this.maxChoices) {
      this.done[this.currentQuestion] = false;
    }
    this.user.updateSelections(this.currentQuestion,
      this.selected.map((_, i) => {
        return event.selectedOptions.selected.some((sel) => sel.value === i);
      }));
    this.update();
  }

  update() {
    this.first = this.currentQuestion === 0;
    this.empty = this.questionnaire.questions.length === 0;
    if (!this.empty) {
      this.last = this.currentQuestion === this.questionnaire.questions.length - 1;
      this.percentage = 100 * (this.currentQuestion + 1) / this.questionnaire.questions.length;
      const cq = this.questionnaire.questions[this.currentQuestion];
      this.description = cq.description;
      this.maxChoices = cq.maxChoices;
      this.choices = cq.choices;
      this.selected = this.user.getSelections(this.currentQuestion);
      this.result = cq.result(this.selected);
      this.hint = cq.hint;
      this.title = cq.title;
      this.correct = cq.correct();
    }
  }
}
