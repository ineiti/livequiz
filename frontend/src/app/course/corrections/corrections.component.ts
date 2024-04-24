import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { GRID_MAX_WIDTH } from '../../app.config';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Course, CourseStateEnum, Dojo, DojoAttempt, Question, Quiz } from '../../../lib/structs';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { StorageService } from '../../services/storage.service';
import { User } from '../../services/user.service';
import { ResultsSummary } from '../../../lib/results_summary';

@Component({
  selector: 'app-corrections',
  standalone: true,
  imports: [CommonModule, MatListModule, MatGridListModule, RouterLink],
  templateUrl: './corrections.component.html',
  styleUrl: './corrections.component.scss'
})
export class CorrectionsComponent {
  @Input() course!: Course;
  dojo!: Dojo;
  quiz!: Quiz;
  question!: Question;
  attempts: DojoAttempt[] = [];
  users: User[] = [];
  tileClasses: string[] = [];
  resultClasses = ['resultCorrect', 'resultCorrect', 'resultWrong', 'resultWrong'];
  resultWidth = ["100%", "50%", "50%", "80%"];
  currentQuestion = 0;
  updateDojo?: Subscription;
  results!: ResultsSummary;
  qIndex = 0;
  sorted: number[][] = [];

  constructor(private livequiz: LivequizStorageService, private storage: StorageService) {
  }

  async ngOnInit() {
    if (this.course.state.state === CourseStateEnum.Idle) {
      console.error("Cannot show corrections in idle mode");
      return;
    }
    this.course.state.state = CourseStateEnum.Corrections;
    this.dojo = await this.livequiz.getDojo(this.course.state.dojoId!);
    this.results = new ResultsSummary(this.storage, this.livequiz, this.dojo.id);
    await this.results.init();
    // DEBUG: Adding 10 test users
    for (let i = 0; i < 10; i++) {
      this.results.addUser();
    }
    this.quiz = await this.livequiz.getQuiz(this.dojo.quizId);
    this.attempts = await this.dojo.getAttempts(this.storage);
    this.users = await this.dojo.getUsers(this.storage);
    this.sorted = this.quiz.questions.map((_, i) => [i, 0]);
    this.updateResults();
    this.goto(0);
  }

  ngOnDestroy() {
    if (this.updateDojo) {
      this.updateDojo.unsubscribe();
    }
  }

  updateResults() {
    const scores: number[][] = [];
    for (let question = 0; question < this.quiz.questions.length; question++) {
      const attemptsAnswered = this.attempts
        .filter((attempt) => attempt.choicesFilled(this.quiz.questions)[question].isAnswered());
      if (attemptsAnswered.length > 0) {
        const sum = attemptsAnswered
          .map<number>((attempt) =>
            this.quiz.questions[question].options.scoreStats(attempt.choices[question]).score)
          .concat([1])
          .reduce((prev, curr) => prev + (1 - curr) ** 2);
        this.sorted[question] = [question, sum / attemptsAnswered.length];
      } else {
        this.sorted[question] = [question, 1]
      }
    }
    this.sorted.sort((a, b) => b[1] - a[1]);
  }

  updateClasses() {
    for (let question = 0; question < this.quiz.questions.length; question++) {
      const score = Math.round(this.sorted[question][1] * 8);
      this.tileClasses[question] = "questionTile" +
        (question % 2 === 1 ? " questionTileOdd" : "") +
        ` questionTileColor${score}`;
    }
    this.tileClasses[this.qIndex] += " questionTileChosen";

    const question = this.quiz.questions[this.sorted[this.qIndex][0]];
    if (question.options.multi !== undefined) {
      this.resultClasses = question.options.multi.correct.map((_) => 'resultCorrect')
        .concat(question.options.multi!.wrong.map((_) => 'resultWrong'));
    } else {
      this.resultClasses = question.options.regexp!.match.map((_) => 'resultCorrect')
    }
    this.resultWidth = this.results.chosen[this.sorted[this.qIndex][0]]
      .map((s) => `${Math.round(s / this.users.length * 50) + 50}%`);
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }

  clearSelection(e: MatSelectionListChange) {
    for (let i = 0; i < e.source.options.length; i++) {
      e.source.options.get(i)!.selected = this.isSelected(i);
    }
  }

  isSelected(index: number): boolean {
    // return index < this.result.maxChoices;
    return false;
  }

  goto(q: number) {
    this.qIndex = q;
    this.question = this.quiz.questions[this.sorted[q][0]];
    console.log(this.results.texts[q]);
    this.updateClasses();
  }
}
