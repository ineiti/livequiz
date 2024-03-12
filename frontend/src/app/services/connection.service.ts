import { Injectable } from '@angular/core';
import { Connection, ConnectionMock, JSONResult, JSONStats } from '../../lib/connection';
import { Buffer } from 'buffer';
import { BehaviorSubject } from 'rxjs';

export type ResultState = ("correct" | "answered" | "empty")

export class Result {
  name: string = "undefined";
  answers: ResultState[] = [];

  constructor(json: JSONResult) {
    this.name = json.name ?? "undefined";
    this.answers = json.answers?.map((a) => a as ResultState) ?? [];
  }
}

export class Stats {
  showResults: boolean = false;
  quizHash: string = "";
  answersHash: string = "";

  constructor(json: JSONStats) {
    this.showResults = json.showResults ?? false;
    this.quizHash = json.quizHash ?? "undefined";
    this.answersHash = json.answersHash ?? "undefined";
  }
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  showResults = new BehaviorSubject(false);
  quizHash = new BehaviorSubject("");
  answersHash = new BehaviorSubject("");
  // private connection = new Connection("https://livequiz.fledg.re");
  private connection = new Connection("http://localhost:8000");
  // private connection = new ConnectionMock();

  constructor() {
    setInterval(() => this.updateStats(), 2000)
    this.updateStats();
  }

  private async updateStats() {
    const stats = await this.getStats();
    if (stats.answersHash !== this.answersHash.value) {
      this.answersHash.next(stats.answersHash);
    }
    if (stats.quizHash !== this.quizHash.value) {
      this.quizHash.next(stats.quizHash);
    }
    if (stats.showResults !== this.showResults.value) {
      this.showResults.next(stats.showResults);
    }
  }

  async updateQuestion(secret: Buffer, question: number, result: ResultState) {
    await this.connection.updateQuestion(secret, question, result);
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

  async getStats(): Promise<Stats> {
    return new Stats(await this.connection.getStats());
  }
}
