import { Component } from '@angular/core';
import { ConnectionService } from '../services/connection.service';
import { Result, ResultState } from '../../lib/connection';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AnswerService } from '../services/answer.service';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { Question, Questionnaire, QuestionnaireService } from '../services/questionnaire.service';
import { ReturnStatement } from '@angular/compiler';
import { UserService } from '../services/user.service';

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
  showResults = false;
  selectedClasses: string[][] = [];
  questionnaire = new Questionnaire("");

  constructor(private connection: ConnectionService, private qservice: QuestionnaireService,
    private user: UserService) {
    qservice.loaded.subscribe((q) => this.questionnaire = q);
  }

  async ngOnInit() {
    await this.update();
    this.showResults = await this.connection.getShowAnswers();
  }

  async update() {
    this.users = await this.connection.getResults();
    this.users.forEach((u) => {
      for (; u.answers.length < this.questionnaire.questions.length; u.answers.push("empty")) { }
    });
    this.users.sort((a, b) => a.name.localeCompare(b.name));
    this.updateSelectedClass();
  }

  async updateSelectedClass() {
    this.selectedClasses = this.users.map((user) =>
      user.answers ? user.answers.map((c) => {
        let cl = c;
        if (c === "correct" && !this.showResults) {
          cl = "answered";
        }
        return `userAnswer_${cl}`;
      }) : [""]
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
    for (let q = 0; q < this.questionnaire.questions.length; q++) {
      const result: ResultState = ["empty", "answered", "correct"][Math.floor(Math.random() * 3)] as ResultState;
      await this.connection.updateQuestion(secret, q, result);
    }
    this.update();
  }

  showResultsUpdate(event: MatSlideToggleChange) {
    this.showResults = event.checked;
    this.connection.setShowAnswers(this.user.secretHex(), this.showResults);
    this.updateSelectedClass();
  }
}
