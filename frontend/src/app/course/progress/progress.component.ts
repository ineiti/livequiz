import { Component, Input } from '@angular/core';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ResultsSummary } from '../../../lib/results_summary';
import { StorageService } from '../../services/storage.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { Course, CourseStateEnum } from '../../../lib/structs';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatListModule, MatSelectionList, MatGridListModule, CommonModule, MatTableModule,
    MatSlideToggleModule, RouterLink, MatButtonModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss'
})
export class ProgressComponent {
  @Input() course!: Course;

  addTestUsers = environment.addTestUsers;
  summary!: ResultsSummary;

  constructor(private storage: StorageService, private livequiz: LivequizStorageService,
    public router: Router, public route: ActivatedRoute, private bcs: BreadcrumbService) {
  }

  async ngOnInit() {
    if (this.course.state.state === CourseStateEnum.Idle) {
      this.router.navigate(['..']);
    } else {
      this.course.state.state = CourseStateEnum.Quiz;
      this.summary = new ResultsSummary(this.storage, this.livequiz, this.course.state.getDojoID());
      await this.summary.init();
    }
    this.bcs.push('Progress', 'progress');
  }

  ngOnDestroy() {
    this.bcs.pop();
  }
}
