import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatListOption, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { GRID_MAX_WIDTH } from '../../../app.config';
import { Dojo, DojoChoice, DojoAttempt as DojoAttempt, Question, Quiz } from "../../../../lib/structs";
import { UserService } from '../../../services/user.service';
import { LivequizStorageService } from '../../../services/livequiz-storage.service';
import { DojoID, UserID } from '../../../../lib/ids';
import { sha256 } from 'js-sha256';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  @Input() dojoId?: DojoID;
  @ViewChild('optionsList') optionsList!: MatSelectionList;
  dojo!: Dojo;
  quiz!: Quiz;
  attempt!: DojoAttempt;
  answer!: Answer;
  show = true;

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
    this.dojo = await this.livequiz.getDojo(this.dojoId!);
    this.quiz = await this.livequiz.getQuiz(this.dojo.quizId);
    this.attempt = await this.livequiz.getDojoAttempt(this.dojo, this.user.secret.hash());
    this.goto(this.currentQuestion);
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
    this.answer = new Answer(this.quiz.questions[this.currentQuestion],
      this.attempt.results[this.currentQuestion], this.user.secret.hash());
  }

  updateAnswer() {
    for (let question = 0; question < this.quiz!.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "") +
        (this.done[question] ? " questionTileDone" : "");
    }

    this.resultClasses = [];
    for (let question = 0; question < this.quiz!.questions.length; question++) {
      this.resultClasses[question] = "question ";
      if (this.showResults && this.answer!.needsCorrection(question)) {
        this.resultClasses[question] = this.answer!.isCorrect(question) ?
          "questionSelectionCorrect" : "questionSelectionWrong";
      }
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
    }
    this.update();
  }
}

export class Answer {
  maxChoices: number = 1;
  options: string[] = [];
  original: number[] = [];
  selected: boolean[] = [];

  constructor(public question: Question, public choice: DojoChoice, user: UserID) {
    if (question.options.multi !== undefined) {
      this.maxChoices = question.options.multi!.correct.length +
        question.options.multi!.wrong.length;
    }

    if (!this.isRegexp()) {
      this.options = question.options.multi!.correct.concat(question.options.multi!.wrong);
      // If the selected field is calculated without a timeout, the mat-selection-list
      // merges changes between 'next' or 'previous'.
      // TODO: to solve this, one should probably use the 'selected' of the 'mat-selection-list'
      // instead of the 'mat-list-option'.
      setTimeout(() => {
        this.original = this.options.map((_, i) => i);
        this.selected = this.options.map((_, i) => choice.multi!.includes(i));
        this.shuffle(user);
      }, 0);
    }
  }

  // Shuffle the answers, seeding using the question and the userID.
  // This allows to have an individual but constant shuffling of each question for tone user,
  // but different for each user.
  shuffle(user: UserID) {
    const multiplier = 1103515245;
    const increment = 12345;
    const modulus = Math.pow(2, 31);
    const hash = sha256.create();
    hash.update(user.data);
    hash.update(JSON.stringify(this.question.toJson()));
    let seed = hash.digest()[0];

    for (let i = this.options.length - 1; i > 0; i--) {
      seed = (multiplier * seed + increment) % modulus;
      const j = Math.floor(seed / (modulus / (i + 1)));
      for (const arr of [this.options, this.original, this.selected]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
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
    this.choice.multi = selected.map((s) => this.original[s.value]);
  }
}
