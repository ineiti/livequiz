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

const GRID_MAX_WIDTH = 13;

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss'
})
export class StudentComponent {
  showResults = true;
  tileClasses: string[] = [];
  resultClasses: string[] = [];
  answer?: Answer;
  private sShowResults?: Subscription;
  private sAnswers?: Subscription;

  constructor(private connection: ConnectionService, public answers: AnswerService,
    public user: UserService) {
    this.sShowResults = connection.showResults.subscribe((show) => {
      this.showResults = show;
      this.updateChoice();
    });
    this.sAnswers = answers.answer.subscribe((a) => {
      this.answer = a;
      this.updateChoice();
    });
  }

  ngOnDestroy() {
    if (this.sShowResults !== undefined) {
      this.sShowResults.unsubscribe();
    }
    if (this.sAnswers !== undefined) {
      this.sAnswers.unsubscribe();
    }
  }

  updateSelection(event: MatSelectionList) {
    this.answers.updateSelection(event);
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

  updateChoice() {
    this.updateTiles();
    const answer = this.answer!;
    if (answer === undefined){
      return;
    }
    
    for (let question = 0; question < answer.choices.length; question++) {
      this.resultClasses[question] = "question " +
        (this.showResults ?
          (answer.selected[question] ? "questionSelectionWrong" : "") : "");
    }
    if (this.showResults) {
      for (let correct = 0; correct < answer.maxChoices; correct++) {
        this.resultClasses[answer.correct[correct]] = "questionSelectionCorrect question";
      }
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
