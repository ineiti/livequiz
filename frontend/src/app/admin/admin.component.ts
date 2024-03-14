import { Component } from '@angular/core';
import { ConnectionService, Result, ResultState } from '../services/connection.service';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { Questionnaire, QuestionnaireService } from '../services/questionnaire.service';
import { UserService } from '../services/user.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatListModule, MatSelectionList, MatGridListModule, CommonModule, MatTableModule,
    MatSlideToggleModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  users: Result[] = [];
  displayedColumns: number[] = [];
  showResults = false;
  editAllowed = true;
  selectedClasses: string[][] = [];
  questionnaire = new Questionnaire("");
  title = "Not available";

  constructor(private connection: ConnectionService, private qservice: QuestionnaireService,
    private user: UserService) {
    qservice.loaded.subscribe((q) => {
      this.questionnaire = q;
      this.update();
    });
    connection.showResults.subscribe((show) => {
      this.showResults = show;
      this.updateSelectedClass();
    });
    connection.editAllowed.subscribe((edit) => {
      this.editAllowed = edit;
    });
    connection.answersHash.subscribe(() => {
      this.update();
    })
  }

  async update() {
    this.users = await this.connection.getResults();
    this.users.forEach((u) => {
      for (; u.answers.length < this.questionnaire.questions.length; u.answers.push("empty")) { }
    });
    this.users.sort((a, b) => a.name.localeCompare(b.name));
    this.updateSelectedClass();
    this.title = this.qservice.loaded.value.chapter;
    this.displayedColumns = this.questionnaire.questions.map((_, i) => i);
  }

  async updateQuestionnaire(){
    await this.connection.updateQuestionnaire(this.user.secret);
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
      const question = this.questionnaire.questions[q];
      question.shuffle();
      const choicesNbr = Math.floor(Math.random() * question.maxChoices);
      const choices = question.original.slice(0, choicesNbr);
      await this.connection.updateQuestion(secret, q, result, choices);
    }
    this.update();
  }

  editAllowedUpdate(event: MatSlideToggleChange) {
    this.editAllowed = event.checked;
    this.connection.setEditAllowed(this.user.secret, this.editAllowed);
  }

  showResultsUpdate(event: MatSlideToggleChange) {
    this.showResults = event.checked;
    this.connection.setShowAnswers(this.user.secret, this.showResults);
    this.updateSelectedClass();
  }
}
