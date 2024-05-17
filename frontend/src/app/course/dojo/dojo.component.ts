import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CourseStateEnum, Dojo, DojoAttempt, Quiz } from "../../../lib/structs";
import { Course } from "../../../lib/structs";
import { QuizComponent } from '../../components/quiz/quiz.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.component';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-dojo',
  standalone: true,
  imports: [RouterOutlet, QuizComponent, CommonModule, MatButtonModule, MatButton],
  templateUrl: './dojo.component.html',
  styleUrl: './dojo.component.scss'
})
export class DojoComponent {
  @Input() course!: Course;
  dojo?: Dojo;
  quiz?: Quiz;
  attempt?: DojoAttempt;

  constructor(private user: UserService, private livequiz: LivequizStorageService,
    private bcs: BreadcrumbService, private stats: StatsService) { }

  ngOnInit() {
    this.bcs.push('Dojo', 'dojo');
    if (!this.user.courses.has(this.course.id.toHex())){
      this.user.courses.set(this.course.id.toHex(), this.course.name);
      this.stats.add(StatsService.course_join);
    }
  }

  ngOnDestroy() {
    this.bcs.pop();
  }

  async ngOnChanges() {
    if (!this.isIdle()) {
      this.dojo = await this.livequiz.getDojo(this.course.state.dojoId!);
      this.quiz = await this.livequiz.getQuiz(this.dojo.quizId);
      this.attempt = await this.livequiz.getDojoAttempt(this.dojo, this.user.id);
    }
  }

  isIdle(): boolean {
    return this.course.state.state === CourseStateEnum.Idle;
  }

  showQuiz(): boolean {
    return !this.isIdle() && this.user.courses.has(this.course.id.toHex());
  }

  showCorrections(): boolean {
    return this.course.state.state === CourseStateEnum.Corrections;
  }

  async getQuiz(): Promise<Quiz | null> {
    return null;
    // return this.livequiz.getQuiz(this.dojo!.quizId)
  }

  async getAttempt(): Promise<DojoAttempt> {
    return this.livequiz.getDojoAttempt(this.dojo!, this.user.id);
  }
}
