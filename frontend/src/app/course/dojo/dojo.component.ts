import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CourseStateEnum, Dojo } from "../../../lib/structs";
import { Course } from "../../../lib/structs";
import { QuizComponent } from './quiz/quiz.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';

@Component({
  selector: 'app-dojo',
  standalone: true,
  imports: [RouterOutlet, QuizComponent, CommonModule],
  templateUrl: './dojo.component.html',
  styleUrl: './dojo.component.scss'
})
export class DojoComponent {
  @Input() course!: Course;

  constructor(private user: UserService) { }

  isIdle(): boolean{
    return this.course.state.state === CourseStateEnum.Idle;
  }

  showQuiz(): boolean{
    return !this.isIdle() && this.user.id.isIn(this.course.students);
  }
  
  showCorrections(): boolean{
    return this.course.state.state === CourseStateEnum.Corrections;
  }
}
