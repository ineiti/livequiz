import { Injectable } from '@angular/core';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { NomadID, Secret } from '../../lib/ids';
import { Nomad } from "../../lib/storage";
import { Course } from '../../lib/structs';

export class User extends Nomad {
  name = "undefined";
  courses = new Map<string, string>();

  override update() {
    const json = JSON.parse(this.json);
    if (json) {
      this.name = json.name;
      console.log("json courses is", json.courses);
      this.updateMap(this.courses, json.courses);
    }
  }

  override toJson(): string {
    return JSON.stringify({ name: this.name, courses: [...this.courses] });
  }

  addCourse(course: Course) {
    this.courses.set(course.id.toHex(), course.name);
  }

  getCourseNames(): Map<string, string> {
    return this.courses;
  }

}

@Injectable({
  providedIn: 'root'
})
export class UserService extends User {
  secret: Secret;

  constructor() {
    super();

    const jsonStr = localStorage.getItem('user-json');
    if (jsonStr === null) {
      const name = localStorage.getItem('user-name');
      if (name === null) {
        this.name = uniqueNamesGenerator({
          dictionaries: [colors, animals],
          separator: '-',
        });
      } else {
        this.name = name;
      }
      this.secret = new Secret();
      this.store();
    } else {
      console.log("got user json", jsonStr);
      const json = JSON.parse(jsonStr);
      this.version = json.reply.version;
      this.json = json.reply.json;
      super.update();
      this.secret = Secret.from_hex(json.secret);
    }

    this.id = this.secret.hash();
  }

  override update() {
    super.update();
    this.store();
  }

  override addCourse(course: Course): void {
    super.addCourse(course);
    this.store();
  }

  store() {
    localStorage.setItem('user-json', JSON.stringify({
      reply: this.getReply(),
      secret: this.secret.toHex(),
    }));
  }
}
