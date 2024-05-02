import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Course } from "../../lib/structs";
import { CommonModule } from '@angular/common';
import { LivequizStorageService } from '../services/livequiz-storage.service';
import { NomadID } from '../../lib/ids';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss'
})
export class CourseComponent {
  @Input() courseId!: string;
  course!: Course;

  constructor(private livequiz: LivequizStorageService, private router: Router) {
  }

  async ngOnInit() {
    try {
      this.course = await this.livequiz.getCourse(NomadID.fromHex(this.courseId))!;
    } catch (e) {
      console.error(e);
      this.router.navigate(['/']);
    }
  }

  onOutletLoaded(component: any) {
    console.log("course loaded", this.courseId, this.course);
    component.course = this.course;
  }
}
