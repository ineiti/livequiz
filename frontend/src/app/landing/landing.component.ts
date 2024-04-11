import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserOldService } from '../services/user.old.service';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CoursesService } from '../services/courses.service';
import { ConnectionService } from '../services/connection.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, MatInputModule, MatButtonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  course_name = "";

  constructor(public user: UserOldService, public courses: CoursesService,
    private connection: ConnectionService) {
  }

  addCourse() {
    this.connection.createCourse(this.course_name);
  }

  updateName() {
    this.user.updateName();
  }
}
