import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { GRID_MAX_WIDTH } from '../../../app.config';
import { Question, QuestionType, Questionnaire } from '../../../services/questionnaire.service';
import { ConnectionService, ResultState } from '../../../services/connection.service';
import { Choice, Dojo, DojoChoice, DojoResult, Quiz } from '../../../../lib/structs';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  @Input() dojo!: Dojo;
  quiz?: Quiz;
  results?: DojoResult;

  showResults = false;
  editAllowed = true;
  tileClasses: string[] = [];
  answer?: Answer;
  resultClasses: string[] = [];
  questionnaire = new Questionnaire("");
  done: boolean[] = [];
  empty = true;
  percentage = 100;
  first = false;
  last = false;
  currentQuestion = 0;

  constructor(private connection: ConnectionService, private user: UserService) { }

  async ngOnInit() {
    this.quiz = await this.connection.getQuiz(this.dojo.quiz_id);
    const userID = this.user.secret.hash();
    if (!this.dojo.results.has(userID.to_hex())) {
      const resID = await this.connection.createDojoResult(this.dojo.id);
      this.dojo.results.set(userID.to_hex(), resID);
    }
    this.results = await this.connection.getResult(userID);
  }

  ngOnChanges() {
    this.resultClasses = [];
    for (let question = 0; question < this.answer!.choices.length; question++) {
      this.resultClasses[question] = "question ";
      if (this.showResults && this.answer!.needsCorrection(question)) {
        this.resultClasses[question] = this.answer!.isCorrect(question) ?
          "questionSelectionCorrect" : "questionSelectionWrong";
      }
    }
  }

  updateSelection(event: MatSelectionList) {
    const selected = event.selectedOptions.selected.length;
    this.done[this.currentQuestion] = selected > 0;
    this.answer!.choice = new DojoChoice({ Multi: event.selectedOptions.selected.map((s) => s.value) });
    this.connection.putDojoChoice(this.results!.id, this.currentQuestion, this.answer!.choice);
    this.updateAnswer();
  }

  updateRegexp() {
    this.connection.putDojoChoice(this.results!.id, this.currentQuestion, this.answer!.choice);
    this.updateAnswer();
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
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
    for (let question = 0; question < this.questionnaire.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "") +
        (this.done[question] ? " questionTileDone" : "");
    }
  }

  previous() {
    this.goto(this.currentQuestion - 1);
  }

  next() {
    this.goto(this.currentQuestion + 1);
  }

  goto(question: number) {
    if (question >= 0 && question < this.questionnaire.questions.length) {
      this.currentQuestion = question;
      this.update();
    }
    this.update();
  }
}

export class Answer {
  description: string;
  title: string;
  maxChoices: number;
  qType: QuestionType;
  choices: string[];
  hint: string;
  result: ResultState;
  correct: number[];

  constructor(cq: Question, public choice: DojoChoice) {
    this.description = cq.description;
    this.maxChoices = cq.maxChoices;
    this.qType = cq.qType;
    this.choices = cq.choices;
    if (this.qType === QuestionType.Regexp) {
      this.result = cq.resultRegexp(this.choice.regexp!)
    } else {
      const bools = cq.choices.map((_, i) => this.choice.multi!.includes(i));
      this.result = cq.resultShuffled(bools);
    }
    this.hint = cq.hint;
    this.title = cq.title;
    this.correct = cq.correct();
  }

  isCorrect(question: number): boolean {
    throw new Error("Not implemented");
  }

  // Either it chosen by the user, or it must be chosen by them.
  needsCorrection(question: number): boolean {
    throw new Error("Not implemented");
  }
}
