import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';

import { GRID_MAX_WIDTH } from '../../app.config';
import { DojoAttempt, Quiz } from "../../../lib/structs";
import { Answer } from "../../../lib/results_summary";
import { UserService } from '../../services/user.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule, MatButtonModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  @Input() quiz?: Quiz;
  @Input() attempt?: DojoAttempt;
  @Input() corrections!: boolean;
  answer!: Answer;
  showOptions = true;

  tileClasses: string[] = [];
  resultClasses: string[] = [];
  first = false;
  last = false;
  currentQuestion = 0;

  constructor(private user: UserService) { }

  async ngOnInit() {
    this.attempt!.initChoices(this.quiz!.questions);
    this.goto(this.currentQuestion);
  }

  ngOnChanges() {
    if (this.answer) {
      this.update();
    }
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
      this.answer = new Answer(this.quiz!.questions[this.currentQuestion],
        this.attempt!.choices[this.currentQuestion], this.user.id);
      this.updateAnswer();
      this.showOptions = true;
    });
  }

  updateAnswer() {
    for (let question = 0; question < this.quiz!.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "");
      if (this.attempt!.choices[question]?.isAnswered()) {
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
