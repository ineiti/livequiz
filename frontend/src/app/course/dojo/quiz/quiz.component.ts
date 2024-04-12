import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatListOption, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { GRID_MAX_WIDTH } from '../../../app.config';
import { ResultState } from '../../../services/connection.service';
import { Options, Dojo, DojoChoice, DojoAttempt as DojoAttempt, Question, Quiz } from '../../../../lib/structs';
import { UserService } from '../../../services/user.service';
import { LivequizStorageService } from '../../../services/livequiz-storage.service';

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
  quiz!: Quiz;
  attempt!: DojoAttempt;
  answer!: Answer;

  showResults = false;
  editAllowed = true;
  tileClasses: string[] = [];
  resultClasses: string[] = [];
  done: boolean[] = [];
  empty = true;
  percentage = 100;
  first = false;
  last = false;
  currentQuestion = 0;

  constructor(private livequiz: LivequizStorageService, private user: UserService) { }

  async ngOnInit() {
    this.quiz = await this.livequiz.getQuiz(this.dojo.quizId);
    this.attempt = await this.livequiz.getDojoAttempt(this.dojo, this.user.secret.hash());
  }

  ngOnChanges() {
    this.resultClasses = [];
    for (let question = 0; question < this.quiz!.questions.length; question++) {
      this.resultClasses[question] = "question ";
      if (this.showResults && this.answer!.needsCorrection(question)) {
        this.resultClasses[question] = this.answer!.isCorrect(question) ?
          "questionSelectionCorrect" : "questionSelectionWrong";
      }
    }
  }

  updateSelection(event: MatSelectionList) {
    this.done[this.currentQuestion] = event.selectedOptions.selected.length > 0;
    this.answer.updateSelection(event.selectedOptions.selected);
    this.updateAnswer();
  }

  updateRegexp() {
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
    this.empty = this.quiz!.questions.length === 0;
    if (!this.empty) {
      this.last = this.currentQuestion === this.quiz!.questions.length - 1;
      this.percentage = 100 * (this.currentQuestion + 1) / this.quiz!.questions.length;
      this.updateAnswer();
    }
  }

  updateAnswer() {
    for (let question = 0; question < this.quiz!.questions.length; question++) {
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
    if (question >= 0 && question < this.quiz!.questions.length) {
      this.currentQuestion = question;
      this.update();
    }
    this.update();
  }
}

export class Answer {
  maxChoices: number = 1;
  options: string[] = [];
  original: number[] = [];
  selected: boolean[] = [];

  constructor(public question: Question, public choice: DojoChoice) {
    if (question.options.multi !== undefined) {
      this.maxChoices = question.options.multi!.correct.length +
        question.options.multi!.wrong.length;
    }

    if (!this.isRegexp()) {
      this.options = question.options.multi!.correct.concat(question.options.multi!.wrong);
      this.original = this.options.map((_, i) => i);
      this.selected = this.options.map((_, i) => i in choice.multi!);
      for (let i = this.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        this.swap(this.options, i, j);
        this.swap(this.original, i, j);
        this.swap(this.selected, i, j);
      }
    }
  }

  private swap<T>(arr: T[], i: number, j: number){
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  isCorrect(question: number): boolean {
    throw new Error("Not implemented");
  }

  // Either it chosen by the user, or it must be chosen by them.
  needsCorrection(question: number): boolean {
    throw new Error("Not implemented");
  }

  isRegexp(): boolean {
    return this.question.options.regexp !== undefined;
  }

  isMulti(): boolean {
    return !this.isRegexp() && this.question.options.multi!.correct.length > 1;
  }

  isSingle(): boolean {
    return !this.isRegexp() && this.question.options.multi!.correct.length === 1;
  }

  updateSelection(selected: MatListOption[]) {
    this.choice = new DojoChoice({ Multi: selected.map((s) => this.original[s.value]) });
  }
}
