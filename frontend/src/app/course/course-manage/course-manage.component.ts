import { Component, Input } from '@angular/core';
import { Quiz } from "../../../lib/structs";
import { Course } from "../../../lib/structs";
import { RouterLink } from '@angular/router';
import { QuizID } from '../../../lib/ids';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';

// TODO: merge this into the CourseComponent. Something something "if no children active, show this".
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

  constructor(private storage: StorageService, private user: UserService,
    private livequiz: LivequizStorageService) { }

  async ngOnInit() {
    for (const id of this.course.quizIds) {
      this.quizzes.push(await this.storage.getNomad(id, new Quiz()));
    }
  }

  currentQuiz(): Quiz | undefined {
    const id = this.course.state.getDojoID();
    for (const q of this.quizzes) {
      if (q.id.equals(id)) {
        return q;
      }
    }
    return undefined;
  }

  isAdmin(): boolean {
    return this.user.isIn(this.course.admins);
  }

  isStudent(): boolean {
    return this.user.isIn(this.course.students);
  }

  async dojoQuiz(id: QuizID) {
    await this.livequiz.setDojoQuiz(this.course.id, id);
  }

  async dojoCorrections() {
    await this.livequiz.setDojoCorrection(this.course.id);
  }

  async dojoIdle() {
    await this.livequiz.setDojoIdle(this.course.id);
  }
}
