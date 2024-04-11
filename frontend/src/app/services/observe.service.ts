import { Injectable } from '@angular/core';
import { CourseID } from '../../lib/ids';
import { ReplaySubject } from 'rxjs';
import { Course } from '../../lib/structs';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class ObserveService {
  courseObservers: Map<string, ReplaySubject<Course>> = new Map();

  constructor(private connection: ConnectionService) {
    this.update();
  }

  async update() {
    for (const entry of this.courseObservers.entries()) {
      if (!entry[1].observed) {
        this.courseObservers.delete(entry[0]);
        continue;
      }
      entry[1].next(await this.connection.getCourse(CourseID.from_hex(entry[0])))
    }

    setTimeout(() => this.update(), 2000);
  }

  async observeCourse(course_id: CourseID): Promise<ReplaySubject<Course>> {
    const co = this.courseObservers.get(course_id.to_hex());
    if (co !== undefined) {
      return co;
    }
    this.courseObservers.set(course_id.to_hex(), new ReplaySubject(1));
    return this.observeCourse(course_id);
  }
}
