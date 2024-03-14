import { Injectable } from '@angular/core';
import { Connection, ConnectionMock, JSONResult, JSONStats } from '../../lib/connection';
import { Buffer } from 'buffer';
import { BehaviorSubject } from 'rxjs';

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
  showResults = new BehaviorSubject(false);
  editAllowed = new BehaviorSubject(true);
  quizHash = new BehaviorSubject("");
  answersHash = new BehaviorSubject("");
  private base = document.location.host.startsWith("localhost") ? "http://localhost:8000" : document.location.origin;
  private connection = new Connection(this.base);
  // private connection = new ConnectionMock();

  constructor() {
    setInterval(() => this.updateStats(), 2000)
    this.updateStats();
  }

  private async updateStats() {
    const stats = await this.getStats();
    if (stats.answersHash !== this.answersHash.value) {
      this.answersHash.next(stats.answersHash);
      this.getResults().then((res) => {
      })
    }
    if (stats.quizHash !== this.quizHash.value) {
      this.quizHash.next(stats.quizHash);
    }
    if (stats.showResults !== this.showResults.value) {
      this.showResults.next(stats.showResults);
    }
    if (stats.editAllowed !== this.editAllowed.value) {
      this.editAllowed.next(stats.editAllowed);
    }
  }

  async updateQuestion(secret: Buffer, question: number, result: ResultState, choices: number[]) {
    await this.connection.updateQuestion(secret, question, result, choices);
  }

  async updateName(secret: Buffer, name: string) {
    await this.connection.updateName(secret, name);
  }

  async getResults(): Promise<Result[]> {
    return (await this.connection.getResults()).map((r) => new Result(r));
  }

  async getQuestionnaire(): Promise<string> {
    return this.connection.getQuestionnaire();
  }

  async updateQuestionnaire(secret: Buffer) {
    this.connection.updateQuestionnaire(secret);
  }

  async setShowAnswers(secret: Buffer, show: boolean) {
    return this.connection.setShowAnswers(secret, show);
  }

  async setEditAllowed(secret: Buffer, edit: boolean) {
    return this.connection.setEditAllowed(secret, edit);
  }

  async getStats(): Promise<Stats> {
    return new Stats(await this.connection.getStats());
  }
}
