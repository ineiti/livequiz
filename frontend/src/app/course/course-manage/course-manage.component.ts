import { Component, Input, ViewChild } from '@angular/core';
import { CourseStateEnum, Quiz } from "../../../lib/structs";
import { Course } from "../../../lib/structs";
import { RouterLink } from '@angular/router';
import { QuizID } from '../../../lib/ids';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { MatButtonModule } from '@angular/material/button';
import { ModalModule } from '../../modal/modal.component';
import { MatDialog } from '@angular/material/dialog';

// TODO: merge this into the CourseComponent. Something something "if no children active, show this".
@Component({
  selector: 'app-course-manage',
  standalone: true,
  imports: [RouterLink, CommonModule, MatButtonModule, ModalModule],
  templateUrl: './course-manage.component.html',
  styleUrl: './course-manage.component.scss'
})
export class CourseManageComponent {
  @Input() course!: Course;
  quizzes: Quiz[] = [];
  quiz?: Quiz;

  constructor(private storage: StorageService, private user: UserService,
    private livequiz: LivequizStorageService,
    public dialog: MatDialog) { }

  async ngOnChanges() {
    this.quizzes = [];
    for (const id of this.course.quizIds) {
      this.quizzes.push(await this.storage.getNomad(id, new Quiz()));
    }
    if (this.course.state.state !== CourseStateEnum.Idle) {
      const dojo = await this.livequiz.getDojo(this.course.state.getDojoID());
      this.quiz = await this.livequiz.getQuiz(dojo.quizId);
    }
    if (!this.user.secret.hash().isIn(this.course.students)){
      console.log("Adding user to course");
      this.course.students.push(this.user.secret.hash());
    }
  }

  isAdmin(): boolean {
    return this.user.isIn(this.course.admins);
  }

  isStudent(): boolean {
    return this.user.isIn(this.course.students);
  }

  async dojoQuiz(id: QuizID) {
    await this.livequiz.setDojoQuiz(this.course.id, id);
  }

  async dojoCorrections() {
    await this.livequiz.setDojoCorrection(this.course.id);
  }

  async dojoIdle() {
    await this.livequiz.setDojoIdle(this.course.id);
  }

  async deleteQuiz(id: QuizID) {
    const quiz = await this.livequiz.getQuiz(id);
    if (await ModalModule.openOKCancel(this.dialog, 'Delete Quiz',
      `Do you want to delete the quiz ${quiz.title}?`
    )) {
      this.course.quizIds = this.course.quizIds.filter((i) => !i.equals(i));
      if (!this.course.state.isIdle() && id.equals(this.quiz!.id)) {
        this.course.state.state = CourseStateEnum.Idle;
      }
      this.ngOnChanges();
    }
  }

  onFileSelected(event: any) {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const q = Quiz.fromStr(e.target.result);
        this.storage.addNomads(q);
        this.course.quizIds.push(q.id);
        this.ngOnChanges();
      } catch (e) {
        await ModalModule.openOKCancel(this.dialog, 'Error',
          `While reading quiz: ${e}`
        );
      }
    };
    reader.readAsText(event.target.files[0]);
  }

  openFileChooser() {
    document.getElementById('fileInput')!.click();
  }

  addQuiz() { }
}
