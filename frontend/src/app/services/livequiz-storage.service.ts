import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Nomad } from "../../lib/storage";
import { NomadID } from "../../lib/ids";
import { CourseStateEnum, Dojo, DojoAttempt, Quiz } from "../../lib/structs";
import { Course } from "../../lib/structs";
import { DojoID, QuizID, UserID } from '../../lib/ids';

@Injectable({
  providedIn: 'root'
})
export class LivequizStorageService {
  private courses: Courses = new Courses();

  constructor(private storage: StorageService) {
    this.storage.addNomad(this.courses);
  }

  async getCourse(courseId: NomadID): Promise<Course> {
    return await this.storage.getNomad(courseId, new Course());
  }

  getCourseNames(): Map<string, string> {
    return this.courses.list;
  }

  async setDojoIdle(courseId: NomadID) {
    const course = await this.getCourse(courseId);
    course.state.state = CourseStateEnum.Idle;
  }

  async setDojoQuiz(courseId: NomadID, quizId: QuizID, dojoId?: DojoID) {
    const course = await this.getCourse(courseId);

    if (dojoId === undefined) {
      const dojo = new Dojo();
      dojo.quizId = quizId;
      this.storage.addNomad(dojo);
      dojoId = dojo.id;
      course.dojoIds.push(dojoId);
    }

    course.state.state = CourseStateEnum.Quiz;
    course.state.dojoId = dojoId;
  }

  async setDojoCorrection(courseId: NomadID, dojoId?: DojoID) {
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

  async getQuiz(id: QuizID): Promise<Quiz> {
    return await this.storage.getNomad(id, new Quiz());
  }

  async getDojo(id: DojoID): Promise<Dojo> {
    return await this.storage.getNomad(id, new Dojo());
  }

  createDojoAttempt(dojo: Dojo, user: UserID): DojoAttempt {
    const dr = new DojoAttempt();
    dr.dojoId = dojo.id;
    this.storage.addNomad(dr);
    return dr;
  }

  async getDojoAttempt(dojo: Dojo, user: UserID): Promise<DojoAttempt> {
    if (!dojo.results.has(user.toHex())) {
      const dr = this.createDojoAttempt(dojo, user);
      dojo.results.set(user.toHex(), dr.id);
    }
    return await this.storage.getNomad(dojo.results.get(user.toHex())!, new DojoAttempt());
  }

  async createCourse(name: string): Promise<Course> {
    const course = new Course();
    course.name = name;
    this.storage.addNomad(course);
    this.courses.list.set(course.id.toHex(), course.name);
    return course;
  }
}

export class Courses extends Nomad {
  static CoursesID = NomadID.fromGlobalID("re.fledg.livequiz.courses");
  list: Map<string, string> = new Map();

  constructor() {
    super();
    this.id = Courses.CoursesID;
  }

  override toJson(): string {
    return JSON.stringify({ list: [...this.list] });
  }

  override update() {
    const content = JSON.parse(this.json);
    this.updateMap(this.list, content.list);
  }
}