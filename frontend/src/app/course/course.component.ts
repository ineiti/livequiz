import { Component, Input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Course } from '../../lib/structs';
import { CourseID } from '../../lib/ids';
import { CoursesService } from '../services/courses.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss'
})
export class CourseComponent {
  @Input() course_id!: string;
  course!: Course;

  constructor(private courses: CoursesService) {
  }

  ngOnInit() {
    this.course = this.courses.list.value.find((c) => c.id.equals(CourseID.from_hex(this.course_id)))!;
  }

  onOutletLoaded(component: any) {
    component.course = this.course;
  }
}
