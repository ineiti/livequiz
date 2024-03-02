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
import { ConnectionService } from '../connection.service';
import { QuestionsService } from '../questions.service';

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
  currentQuestion = 0;
  name = "undefined";
  showHints = true;
  userSecret = Buffer.alloc(32);

  constructor(private connection: ConnectionService, public questions: QuestionsService) {
  }

  async ngOnInit() {
    const user_secret = localStorage.getItem('user-secret');
    if (user_secret === null) {
      self.crypto.getRandomValues(this.userSecret);
      localStorage.setItem('user-secret', this.userSecret.toString('hex'));
    } else {
      this.userSecret = Buffer.from(user_secret, 'hex');
    }

    const name = localStorage.getItem('user-name');
    if (name === null) {
      this.name = uniqueNamesGenerator({
        dictionaries: [colors, animals],
        separator: '-',
      });
    } else {
      this.name = name;
    }
    this.updateName();
  }

  updateSelection(event: MatSelectionList) {
    this.questions.updateSelection(event);
    this.connection.updateQuestion(this.userSecret, this.questions.currentQuestion,
      this.questions.selected.map<[boolean, number]>((s, i) => [s, i]).filter((s) => s[0]).map((s) => s[1]));
  }

  updateName() {
    localStorage.setItem('user-name', this.name);
    this.connection.updateName(this.userSecret, this.name);
  }

  tileClass(index: number): string {
    return "questionTile" + (this.questions.currentQuestion === index ? " questionTileChosen" : "") +
      (index % 2 === 1 ? " questionTileOdd" : "") +
      (this.questions.done[index] ? " questionTileDone" : "");
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }
}
