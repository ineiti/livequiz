import { Component, Input } from '@angular/core';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Course } from "../../../../lib/structs";

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [MatListModule, MatSelectionList, MatGridListModule, CommonModule, MatTableModule,
    MatSlideToggleModule, RouterLink],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent {
  @Input() course!: Course;
  // users: Result[] = [];
  displayedColumns: number[] = [];
  selectedClasses: string[][] = [];
  // questionnaire = new Questionnaire("");
  title = "Not available";
  addTestUsers = environment.addTestUsers;

  // constructor(private connection: ConnectionService, private qservice: QuestionnaireService,
  //   private user: UserOldService, private router: Router) {
  //   qservice.loaded.subscribe((q) => {
  //     this.questionnaire = q;
  //     this.update();
  //   });
  //   connection.answersHash.subscribe(() => {
  //     this.update();
  //   })
  // }

  ngOnInit() {
    // if (this.course.admins.includes(this.user.secret.hash())) {
    //   this.router.navigate(['..']);
    // }
  }

  async update() {
    // this.users = await this.connection.getResults();
    // this.users.forEach((u) => {
    //   for (; u.answers.length < this.questionnaire.questions.length; u.answers.push("empty")) { }
    // });
    // this.users.sort((a, b) => a.name.localeCompare(b.name));
    // this.updateSelectedClass();
    // this.title = this.qservice.loaded.value.chapter;
    // this.displayedColumns = this.questionnaire.questions.map((_, i) => i);
  }

  async updateSelectedClass() {
    // this.selectedClasses = this.users.map((user) =>
    //   user.answers ? user.answers.map((c) => {
    //     let cl = c;
    //     if (c === "correct") {
    //       cl = "answered";
    //     }
    //     return `userAnswer_${cl}`;
    //   }) : [""]
    // )
  }

  async addUser() {
    const secret = Buffer.alloc(32);
    self.crypto.getRandomValues(secret);

    const name = uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: '-',
    });
    // await this.connection.updateName(secret, name);
    // for (let q = 0; q < this.questionnaire.questions.length; q++) {
    //   const result: ResultState = ["empty", "answered", "correct"][Math.floor(Math.random() * 3)] as ResultState;
    //   const question = this.questionnaire.questions[q];
    //   question.shuffle();
    //   const choicesNbr = Math.floor(Math.random() * (question.maxChoices + 1));
    //   const choices = question.original.slice(0, choicesNbr);
    //   await this.connection.updateQuestion(secret, q, result, choices);
    // }
    this.update();
  }
}
