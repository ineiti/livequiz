import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Course } from '../../lib/structs';
import { CourseID } from '../../lib/ids';
import { UserService } from './user.service';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  list = new BehaviorSubject<Course[]>([]);

  constructor(private user: UserService, private connection: ConnectionService) {
    this.update_courses();
  }

  private async update_courses() {
    this.list.next(await this.connection.getCourses());
    setTimeout(() => this.update_courses(), 2000);
  }
}
