import { Component } from '@angular/core';
import { ConnectionService } from '../connection.service';
import { Result } from '../../lib/connection';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QuestionsService } from '../questions.service';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatListModule, MatSelectionList, MatGridListModule, CommonModule, MatTableModule,
    MatSlideToggleModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  users: Result[] = [];
  displayedColumns = [1, 3, 2];
  results = false;
  selectedClasses: string[][] = [];

  constructor(private connection: ConnectionService, private questions: QuestionsService) { }

  async ngOnInit() {
    await this.update();
  }

  async update() {
    this.users = await this.connection.getResults();
    this.updateSelectedClass();
  }

  async updateSelectedClass() {
    this.selectedClasses = this.users.map((user) =>
      user.answers ? user.answers.map((c) => `userAnswer_${c}`) : [""]
    )
  }

  async addUser() {
    const secret = Buffer.alloc(32);
    self.crypto.getRandomValues(secret);

    const name = uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: '-',
    });
    await this.connection.updateName(secret, name);
    for (this.questions.currentQuestion = 0;
      this.questions.currentQuestion < this.questions.questions.length;
      this.questions.currentQuestion++) {
      const array = [...Array(this.questions.choices.length).keys()];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      const selected = Math.floor(Math.random() * (this.questions.maxChoices + 1));
      if (selected > 0) {
        await this.connection.updateQuestion(secret, this.questions.currentQuestion,
          array.slice(0, selected));
      }
    }
    this.update();
  }

  showResults(event: MatSlideToggleChange) {
    this.results = event.checked;
    this.updateSelectedClass();
  }
}
