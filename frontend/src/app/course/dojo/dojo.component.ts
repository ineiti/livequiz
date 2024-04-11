import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Course, CourseStateEnum } from '../../../lib/structs';
import { ConnectionService } from '../../services/connection.service';
import { QuizComponent } from './quiz/quiz.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dojo',
  standalone: true,
  imports: [RouterOutlet, QuizComponent, CommonModule],
  templateUrl: './dojo.component.html',
  styleUrl: './dojo.component.scss'
})
export class DojoComponent {
  @Input() course!: Course;

  constructor(private connection: ConnectionService) { }

  ngOnChanges() {
    console.log(`dojo: ${this.course.name}`);
  }

  is_idle(): boolean{
    return this.course.state.state === CourseStateEnum.Idle;
  }
  is_quiz(): boolean{
    return this.course.state.state === CourseStateEnum.Idle;
  }
  is_corrections(): boolean{
    return this.course.state.state === CourseStateEnum.Idle;
  }
}
