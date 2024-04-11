import { Component, Input } from '@angular/core';
import { Course, Quiz } from '../../../lib/structs';
import { RouterLink } from '@angular/router';
import { QuizID } from '../../../lib/ids';
import { CommonModule } from '@angular/common';
import { ConnectionService } from '../../services/connection.service';
import { ObserveService } from '../../services/observe.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-course-manage',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './course-manage.component.html',
  styleUrl: './course-manage.component.scss'
})
export class CourseManageComponent {
  @Input() course!: Course;
  quizzes: Quiz[] = [];
  courseUpdate?: Subscription;

  constructor(private connection: ConnectionService, private observe: ObserveService,
    private user: UserService) { }

  async ngOnInit() {
    for (const id of this.course.quiz_ids) {
      this.quizzes.push(await this.connection.getQuiz(id));
    }
    this.courseUpdate = (await this.observe.observeCourse(this.course.id)).subscribe((c) => this.course = c);
  }

  async ngOnDestroy() {
    this.courseUpdate?.unsubscribe();
  }

  currentQuiz(): Quiz | undefined {
    const id = this.course.state.dojo_id();
    for (const q of this.quizzes){
      if (q.id.equals(id)){
        return q;
      }
    }
    return undefined;
  }

  isAdmin(): boolean {
    return this.user.secret.hash().is_in(this.course.admins);
  }

  isStudent(): boolean {
    return this.user.secret.hash().is_in(this.course.students);
  }

  async dojoQuiz(id: QuizID) {
    await this.connection.dojoQuiz(this.course.id, id);
  }

  async dojoCorrections() {
    await this.connection.dojoCorrections(this.course.id, this.course.state.id!);
  }

  async dojoIdle() {
    await this.connection.dojoIdle(this.course.id);
  }
}
