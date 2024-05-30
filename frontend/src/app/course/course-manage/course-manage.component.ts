import { Component, Input } from '@angular/core';
import { CourseStateEnum, Quiz } from "../../../lib/structs";
import { Course } from "../../../lib/structs";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuizID } from '../../../lib/ids';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { MatButtonModule } from '@angular/material/button';
import { ModalModule } from '../../components/modal/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { StatsService } from '../../services/stats.service';

// TODO: merge this into the CourseComponent. Something something "if no children active, show this".
@Component({
  selector: 'app-course-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, MatButtonModule, ModalModule, CdkDropList, CdkDrag],
  templateUrl: './course-manage.component.html',
  styleUrl: './course-manage.component.scss'
})
export class CourseManageComponent {
  @Input() course!: Course;
  quizzes: Quiz[] = [];
  quiz?: Quiz;
  updateQuizId?: QuizID;

  constructor(private storage: StorageService, private user: UserService,
    private livequiz: LivequizStorageService, private router: Router,
    public dialog: MatDialog, private route: ActivatedRoute,
    private stats: StatsService) { }

  async ngOnChanges() {
    await this.updateQuizzes();
    if (!this.isStudent()) {
      this.user.courses.set(this.course.id.toHex(), this.course.name);
      this.stats.add(StatsService.course_join);
    }
    if (!this.user.courses.has(this.course.id.toHex())) {
      this.user.addCourse(this.course);
    }
    this.user.update();
    await this.updateDojo();
  }

  async updateDojo(){
    if (this.course.state.state !== CourseStateEnum.Idle) {
      const dojo = await this.livequiz.getDojo(this.course.state.getDojoID());
      this.quiz = await this.livequiz.getQuiz(dojo.quizId);
    }
  }

  async updateQuizzes(){
    this.quizzes = [];
    for (const id of this.course.quizIds) {
      this.quizzes.push(await this.storage.getNomad(id, new Quiz()));
    }
  }

  isAdmin(): boolean {
    return this.user.isIn(this.course.admins);
  }

  isStudent(): boolean {
    return this.user.courses.has(this.course.id.toHex());
  }

  async dojoQuiz(id: QuizID) {
    this.stats.add(StatsService.dojo_start);
    await this.livequiz.setDojoQuiz(this.course.id, id);
    await this.updateDojo();
  }

  async dojoCorrections() {
    await this.livequiz.setDojoCorrection(this.course.id);
  }

  async dojoIdle() {
    this.stats.add(StatsService.dojo_stop);
    await this.livequiz.setDojoIdle(this.course.id);
    await this.updateDojo();
  }

  async deleteQuiz(id: QuizID) {
    const quiz = await this.livequiz.getQuiz(id);
    if (await ModalModule.openOKCancel(this.dialog, 'Delete Quiz',
      `Do you want to delete the quiz ${quiz.title}?`
    )) {
      this.course.quizIds = this.course.quizIds.filter((i) => !id.equals(i));
      if (!this.course.state.isIdle() && id.equals(this.quiz!.id)) {
        this.course.state.state = CourseStateEnum.Idle;
      }
      this.stats.add(StatsService.quiz_delete);
      await this.updateDojo();
      await this.updateQuizzes();
    }
  }

  onFileSelected(event: any) {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const q = Quiz.fromStr(e.target.result);
        if (this.updateQuizId) {
          const quiz = await this.livequiz.getQuiz(this.updateQuizId!);
          quiz.json = q.toJson();
          quiz.update();
          quiz.json = "";
          this.stats.add(StatsService.quiz_update);
        } else {
          q.owners.push(this.user.id);
          this.storage.addNomads(q);
          this.course.quizIds.push(q.id);
          this.stats.add(StatsService.quiz_create_upload);
        }
        this.updateQuizzes();
      } catch (e) {
        await ModalModule.openOKCancel(this.dialog, 'Error',
          `While reading quiz: ${e}`
        );
      }
    };
    reader.readAsText(event.target.files[0]);
  }

  openFileChooser(updateQuizId?: QuizID) {
    this.updateQuizId = updateQuizId;
    document.getElementById('fileInput')!.click();
  }

  addQuiz() { }

  createQuiz() {
    this.router.navigate(['./createQuiz'], { relativeTo: this.route });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.course.quizIds, event.previousIndex, event.currentIndex);
    moveItemInArray(this.quizzes, event.previousIndex, event.currentIndex);
  }
}
