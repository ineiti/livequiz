import { Injectable } from '@angular/core';
import { Connection, ConnectionMock, Result, ResultState } from '../../lib/connection';
import { Buffer } from 'buffer';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  showResults = new BehaviorSubject(false);
  // private connection = new Connection("https://livequiz.fledg.re");
  // private connection = new Connection("http://localhost:8000");
  private connection = new ConnectionMock();

  constructor() {
    setInterval(() => this.updateShowAnswers(), 2000)
    this.updateShowAnswers();
  }

  private async updateShowAnswers() {
    this.showResults.next(await this.getShowAnswers());
  }

  async updateQuestion(secret: Buffer, question: number, result: ResultState) {
    await this.connection.updateQuestion(secret, question, result);
  }

  async updateName(secret: Buffer, name: string) {
    await this.connection.updateName(secret, name);
  }

  async getResults(): Promise<Result[]> {
    return await this.connection.getResults();
  }

  async getQuestionnaire(): Promise<string> {
    return this.connection.getQuestionnaire();
  }

  async updateQuestionnaire(secret: Buffer) {
    this.connection.updateQuestionnaire(secret);
  }

  async getShowAnswers(): Promise<boolean> {
    return this.connection.getShowAnswers();
  }

  async setShowAnswers(secret: string, show: boolean) {
    return this.connection.setShowAnswers(secret, show);
  }
}
