import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
  @Input() corrections!: boolean;
  dojo!: Dojo;
  quiz!: Quiz;
  attempt!: DojoAttempt;
  answer!: Answer;
  showOptions = true;

  tileClasses: string[] = [];
  resultClasses: string[] = [];
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
    this.showOptions = false;
    // This makes the display flicker a bit between every change, but else the MatSelectionList
    // gets confused if a user clicks a field, and then switches to another question,
    // which should have the clicked field non-selected. The confusion arises by the fact that the
    // previously clicked field also shows activated in the new question. Going back and forth
    // again without clicking the field resets to the correct state.
    // TODO: to solve this, one should probably use the 'selected' of the 'mat-selection-list'
    // instead of the 'mat-list-option'.
    setTimeout(() => {
      this.first = this.currentQuestion === 0;
      this.last = this.currentQuestion === this.quiz!.questions.length - 1;
      this.answer = new Answer(this.quiz.questions[this.currentQuestion],
        this.attempt.choices[this.currentQuestion], this.user.secret.hash());
      this.updateAnswer();
      this.showOptions = true;
    });
  }

  updateAnswer() {
    for (let question = 0; question < this.quiz!.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "");
      if (this.attempt.choices[question]?.isAnswered()) {
        this.tileClasses[question] += " questionTileDone";
      }
    }

    this.resultClasses = [];
    for (let option = 0; option < this.answer!.maxChoices; option++) {
      this.resultClasses[option] = "option ";
      if (this.corrections && this.answer.needsCorrection(option)) {
        this.resultClasses[option] = this.answer.correctAnswer(option) ?
          "optionCorrect" : "optionWrong";
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
      this.original = this.options.map((_, i) => i);
      this.selected = this.options.map((_, i) => choice.multi!.includes(i));
      this.shuffle(user);
    }
  }

  // Shuffle the answers, seeding using the question and the userID.
  // This allows to have an individual but constant shuffling of each question for one user,
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

  // Returns whether the given option would be correct (for multiple choice),
  // or if the entered regexp is correct. 
  correctAnswer(option: number): boolean {
    if (this.question.options.regexp !== undefined) {
      return this.question.options.regexp!.isCorrect(this.choice.regexp!);
    } else {
      return this.original[option] < this.question.options.multi!.correct.length;
    }
  }

  isCorrectMulti(option: number): boolean {
    return this.original[option] < this.question.options.multi!.correct.length;
  }

  // Either it chosen by the user, or it must be chosen by them.
  needsCorrection(option: number): boolean {
    return this.selected[option] || this.isRegexp() || this.isCorrectMulti(option);
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

  updateSelection(selected: MatListOption[] | { value: number }[]) {
    this.choice.multi = selected.map((s) => this.original[s.value]);
  }
}
