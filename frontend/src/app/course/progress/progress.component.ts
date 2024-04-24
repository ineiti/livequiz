import { Component, Input } from '@angular/core';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ResultsSummary } from '../../../lib/results_summary';
import { StorageService } from '../../services/storage.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { DojoID } from '../../../lib/ids';
import { Course, CourseStateEnum, DojoAttempt, DojoChoice } from '../../../lib/structs';
import { User } from '../../services/user.service';
import { Answer } from '../dojo/quiz/quiz.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatListModule, MatSelectionList, MatGridListModule, CommonModule, MatTableModule,
    MatSlideToggleModule, RouterLink],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent {
  @Input() course!: Course;

  addTestUsers = environment.addTestUsers;
  summary!: ResultsSummary;

  constructor(private storage: StorageService, private livequiz: LivequizStorageService,
    private router: Router) {
  }

  async ngOnInit() {
    if (this.course.state.state === CourseStateEnum.Idle) {
      this.router.navigate(['..']);
    } else {
      this.course.state.state = CourseStateEnum.Quiz;
      this.summary = new ResultsSummary(this.storage, this.livequiz, this.course.state.getDojoID());
      await this.summary.init();
    }
  }
}
