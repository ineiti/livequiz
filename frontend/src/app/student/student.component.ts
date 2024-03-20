import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ConnectionService } from '../services/connection.service';
import { Answer, AnswerService } from '../services/answer.service';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';
import { ExerciseComponent } from '../exercise/exercise.component';
import { GRID_MAX_WIDTH } from '../app.config';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule, ExerciseComponent],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss'
})
export class StudentComponent {
  showResults = false;
  editAllowed = true;
  tileClasses: string[] = [];
  answer?: Answer;
  private sShowResults?: Subscription;
  private sEditAllowed?: Subscription;
  private sAnswers?: Subscription;

  constructor(private connection: ConnectionService, public answers: AnswerService,
    public user: UserService) {
    this.sShowResults = connection.showResults.subscribe((show) => {
      this.showResults = show;
      this.updateTiles();
    });
    this.sEditAllowed = connection.editAllowed.subscribe((edit) => {
      this.editAllowed = edit;
    });
    this.sAnswers = answers.answer.subscribe((a) => {
      this.answer = a;
      this.updateTiles();
    });
  }

  ngOnDestroy() {
    if (this.sShowResults !== undefined) {
      this.sShowResults.unsubscribe();
    }
    if (this.sEditAllowed !== undefined) {
      this.sEditAllowed.unsubscribe();
    }
    if (this.sAnswers !== undefined) {
      this.sAnswers.unsubscribe();
    }
  }

  updateSelection(event: MatSelectionList | string) {
    if (typeof event === "string") {
      this.answers.updateRegexp(event);
    } else {
      this.answers.updateSelection(event);
    }
  }

  updateName() {
    this.user.updateName();
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }

  updateTiles() {
    for (let question = 0; question < this.answers.questionnaire.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.answers.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "") +
        (this.answers.done[question] ? " questionTileDone" : "");
    }
  }

  previous() {
    this.goto(this.answers.currentQuestion - 1);
  }

  next() {
    this.goto(this.answers.currentQuestion + 1);
  }

  goto(question: number) {
    this.answers.goto(question);
    this.updateTiles();
  }
}
