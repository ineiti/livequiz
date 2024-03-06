import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { ConnectionService } from '../services/connection.service';
import { AnswerService } from '../services/answer.service';
import { UserService } from '../services/user.service';

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

  constructor(private connection: ConnectionService, public answers: AnswerService,
    public user: UserService) {
  }

  async ngOnInit() {
    this.showResults = await this.connection.getShowAnswers();
    this.update();
  }

  updateSelection(event: MatSelectionList) {
    this.answers.updateSelection(event);
    this.connection.updateQuestion(this.user.secret, this.answers.currentQuestion,
      this.answers.result);
    this.update();
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

  update() {
    for (let question = 0; question < this.answers.questionnaire.questions.length; question++) {
      this.tileClasses[question] = "questionTile" + (this.answers.currentQuestion === question ? " questionTileChosen" : "") +
        (question % 2 === 1 ? " questionTileOdd" : "") +
        (this.answers.done[question] ? " questionTileDone" : "");
    }
    if (this.showResults) {
      for (let question = 0; question < this.answers.choices.length; question++) {
        this.resultClasses[question] = this.answers.selected[question] ? "questionSelectionWrong" : "";
      }
      for (let correct = 0; correct < this.answers.maxChoices; correct++) {
        this.resultClasses[this.answers.correct[correct]] = "questionSelectionCorrect";
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
    this.update();
  }
}
