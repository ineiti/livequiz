import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../services/user.service';
import { LivequizStorageService } from '../services/livequiz-storage.service';
import { Course } from '../../lib/structs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  course_name = "";
  courses: Map<string, Course>;

  constructor(public user: UserService, private livequiz: LivequizStorageService) {
    this.courses = livequiz.courses.list;
  }

  async addCourse() {
    const course = await this.livequiz.createCourse(this.course_name);
    course.admins = [this.user.secret.hash()];
  }
}
