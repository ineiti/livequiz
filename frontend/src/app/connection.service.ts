import { Injectable } from '@angular/core';
import { ConnectionMock, Result } from '../lib/connection';
import { Buffer } from 'buffer';
import { QuestionsService } from './questions.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connection = new ConnectionMock(this.questions);

  constructor(private questions: QuestionsService) { }

  async updateQuestion(secret: Buffer, question: number, selected: number[]) {
    await this.connection.updateQuestion(secret, question, selected);
  }

  async updateName(secret: Buffer, name: string) {
    await this.connection.updateName(secret, name);
  }

  async getResults(): Promise<Result[]> {
    return this.connection.getResults();
  }

}
