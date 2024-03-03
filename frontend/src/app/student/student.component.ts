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
  showHints = true;

  constructor(private connection: ConnectionService, public answers: AnswerService,
    public user: UserService) {
  }

  updateSelection(event: MatSelectionList) {
    this.answers.updateSelection(event);
    this.connection.updateQuestion(this.user.secret, this.answers.currentQuestion,
      this.answers.result);
  }

  updateName() {
    this.user.updateName();
  }

  tileClass(index: number): string {
    return "questionTile" + (this.answers.currentQuestion === index ? " questionTileChosen" : "") +
      (index % 2 === 1 ? " questionTileOdd" : "") +
      (this.answers.done[index] ? " questionTileDone" : "");
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }
}
