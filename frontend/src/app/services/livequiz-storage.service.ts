import { Injectable } from '@angular/core';
import { Blob, BlobID, StorageService } from './storage.service';
import { Course, CourseStateEnum, Dojo } from '../../lib/structs';
import { DojoID, QuizID } from '../../lib/ids';

@Injectable({
  providedIn: 'root'
})
export class LivequizStorageService {
  courses = new Courses();

  constructor(private storage: StorageService) {
    this.storage.addBlob(this.courses);
  }

  async getCourse(courseId: BlobID): Promise<Course> {
    let course = this.courses.list.get(courseId.toHex());
    if (course === undefined) {
      course = await this.storage.getBlob(courseId, new Course());
    }
    return course;
  }

  async setDojoIdle(courseId: BlobID) {
    const course = await this.getCourse(courseId);
    course.state.state = CourseStateEnum.Idle;
  }

  async setDojoQuiz(courseId: BlobID, quizId: QuizID, dojoId?: DojoID) {
    const course = await this.getCourse(courseId);

    if (dojoId === undefined) {
      const dojo = new Dojo();
      dojo.quizId = quizId;
      this.storage.addBlob(dojo);
      dojoId = dojo.id;
      course.dojoIds.push(dojoId);
    }

    course.state.state = CourseStateEnum.Quiz;
    course.state.dojoId = dojoId;
  }

  async setDojoCorrection(courseId: BlobID, dojoId?: DojoID) {
    const course = await this.getCourse(courseId);

    if (dojoId === undefined) {
      if (course.state.state === CourseStateEnum.Idle) {
        throw new Error("Couldn't get dojoID");
      }
      dojoId = course.state.dojoId!;
    }

    course.state.dojoId = dojoId;
    course.state.state = CourseStateEnum.Corrections;
  }
}

class Courses extends Blob {
  list: Map<string, Course> = new Map();

  constructor() {
    super();
    this.id = BlobID.fromGlobalID("re.fledg.livequiz.courses");
  }

  override toJson(): string {
    return JSON.stringify({ list: [...this.list] });
  }

  override update() {
    const content = JSON.parse(this.json);
    this.updateMap(this.list, content.list);
  }
}