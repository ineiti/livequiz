import { Injectable } from '@angular/core';
import { Connection, ConnectionMock, Result, ResultState } from '../lib/connection';
import { Buffer } from 'buffer';
import { QuestionsService } from './questions.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connection = new Connection("http://localhost:8000");
  // private connection = new ConnectionMock(this.questions);

  constructor(private questions: QuestionsService) { }

  async updateQuestion(secret: Buffer, question: number, selected: number[]) {
    console.log(`Selected is: ${selected}`);
    let result: ResultState = "empty";
    if (selected.length > 0) {
      result = this.questions.questions[question].correct(selected) ? "correct" : "answered";
    }
    await this.connection.updateQuestion(secret, question, result);
  }

  async updateName(secret: Buffer, name: string) {
    await this.connection.updateName(secret, name);
  }

  async getResults(): Promise<Result[]> {
    let res = await this.connection.getResults();
    res.forEach((u) => {
      for (; u.answers.length < this.questions.questions.length; u.answers.push("empty")) { }
    })
    return res;
  }

}
