import { Injectable } from '@angular/core';
import { JSONResult, JSONStats } from '../../lib/connection';
import { ConnectionMock } from '../../lib/connection_mock';
import { BehaviorSubject } from 'rxjs';
import { CourseID, DojoID, DojoResultID, QuizID, Secret } from '../../lib/ids';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { Course, Dojo, DojoChoice, DojoResult, Quiz } from '../../lib/structs';
import { BlobID, JSONBlob, JSONBlobUpdateRequest, JSONBlobUpdateReply } from './storage.service';

export type ResultState = ("correct" | "answered" | "empty")

export class Result {
  name: string = "undefined";
  answers: ResultState[] = [];
  choices: number[][] = [];

  constructor(json: JSONResult) {
    this.name = json.name ?? "undefined";
    this.answers = json.answers?.map((a) => a as ResultState) ?? [];
    this.choices = json.choices ?? [];
  }
}

export class Stats {
  showResults: boolean = false;
  editAllowed: boolean = true;
  quizHash: string = "";
  answersHash: string = "";

  constructor(json: JSONStats) {
    this.showResults = json.showResults ?? false;
    this.editAllowed = json.editAllowed ?? false;
    this.quizHash = json.quizHash ?? "undefined";
    this.answersHash = json.answersHash ?? "undefined";
  }
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connection = new ConnectionMock();

  constructor(private user: UserService) {
    if (environment.realBackend) {
      //   const base = document.location.host.startsWith("localhost") ? "http://localhost:8000" : document.location.origin;
      //   this.connection = new Connection(base);
    } else {
      this.connection.initBasic(this.user.secret);
    }
  }

  async getBlobUpdates(updates: JSONBlobUpdateRequest): Promise<JSONBlobUpdateReply> {
    return this.connection.getBlobUpdates(updates);
  }
}
