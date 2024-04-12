import { Component, Input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Course } from '../../lib/structs';
import { CommonModule } from '@angular/common';
import { LivequizStorageService } from '../services/livequiz-storage.service';

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

  constructor(private livequiz: LivequizStorageService) {
  }

  ngOnInit() {
    this.course = this.livequiz.courses.list.get(this.course_id)!;
  }

  onOutletLoaded(component: any) {
    component.course = this.course;
  }
}
