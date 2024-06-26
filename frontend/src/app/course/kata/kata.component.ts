import { Component, Input } from '@angular/core';
import { Course, DojoAttempt, Quiz } from '../../../lib/structs';
import { QuizID } from '../../../lib/ids';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QuizComponent } from '../../components/quiz/quiz.component';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.component';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-kata',
  standalone: true,
  imports: [MatSlideToggleModule, CommonModule, QuizComponent, FormsModule],
  templateUrl: './kata.component.html',
  styleUrl: './kata.component.scss'
})
export class KataComponent {
  @Input() quizId!: string;
  quiz?: Quiz;
  attempt = new DojoAttempt();
  corrections = false;

  constructor(private livequiz: LivequizStorageService, private bcs: BreadcrumbService,
    private stats: StatsService) { }

  async ngOnInit() {
    this.bcs.push('Kata', `kata/${this.quizId}`);
    this.quiz = await this.livequiz.getQuiz(QuizID.fromHex(this.quizId));
    this.stats.add(StatsService.kata_start);
  }

  ngOnDestroy() {
    this.bcs.pop();
  }
}
