import { Component } from '@angular/core';
import { ConnectionService } from '../connection.service';
import { Result, ResultState } from '../../lib/connection';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AnswerService } from '../answer.service';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { Question, Questionnaire, QuestionnaireService } from '../questionnaire.service';
import { ReturnStatement } from '@angular/compiler';

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
  questionnaire = new Questionnaire("");

  constructor(private connection: ConnectionService, private qservice: QuestionnaireService) {
    qservice.loaded.subscribe((q) => this.questionnaire = q);
  }

  async ngOnInit() {
    await this.update();
  }

  async update() {
    this.users = await this.connection.getResults();
    this.users.forEach((u) => {
      for (; u.answers.length < this.questionnaire.questions.length; u.answers.push("empty")) { }
    })
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
    for (let q = 0; q < this.questionnaire.questions.length; q++) {
      const result: ResultState = ["empty", "answered", "correct"][Math.floor(Math.random() * 3)] as ResultState;
      await this.connection.updateQuestion(secret, q, result);
    }
    this.update();
  }

  showResults(event: MatSlideToggleChange) {
    this.results = event.checked;
    this.updateSelectedClass();
  }
}
