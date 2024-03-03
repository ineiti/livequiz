import { Injectable } from '@angular/core';
import { Connection, ConnectionMock, Result, ResultState } from '../lib/connection';
import { Buffer } from 'buffer';
import { AnswerService } from './answer.service';
import { Questionnaire, QuestionnaireService } from './questionnaire.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connection = new Connection("http://localhost:8000");
  // private connection = new ConnectionMock(this.questions);

  constructor() {
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

  async getShowAnswers(): Promise<boolean> {
    return this.connection.getShowAnswers();
  }

  async setShowAnswers(secret: string, show: boolean) {
    return this.connection.setShowAnswers(secret, show);
  }
}
