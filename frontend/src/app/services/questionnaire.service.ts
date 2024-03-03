import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { AnswerService } from './answer.service';
import { ResultState } from '../../lib/connection';

export class Question {
  title: string = ""
  description: string = ""
  hint: string = ""
  maxChoices: number = 0
  choices: string[] = []
  solution: boolean[] = []

  shuffle() {
    this.solution = this.choices.map((_, i) => i < this.maxChoices)
    for (let i = this.choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]];
      [this.solution[i], this.solution[j]] = [this.solution[j], this.solution[i]];
    }
  }

  result(selected: boolean[]): ResultState {
    if (selected.length === 0){
      return "empty";
    }
    return selected
      .filter((s, i) => s && this.solution[i])
      .length === this.maxChoices ? "correct" : "answered";
  }
}

export class Questionnaire {
  questions: Question[] = [];
  chapter = "";

  constructor(text: string){
    let current = new Question();
    let hint = false;
    for (const line of text.split("\n")) {
      if (line.length === 0) {
        continue;
      }
      const linePre = line.replace(/`(.*?)`/g, "<span class='pre'>$1</span>");
      const interpret = linePre.match(/([#=-]*) *(.*)/);
      if (interpret?.length != 3) {
        console.error(`Cannot parse line ${line}`);
        continue;
      }
      const [_, tag, text] = interpret;
      switch (tag) {
        case '#':
          this.chapter = text;
          break;
        case '##':
          if (current.title !== "") {
            current.shuffle();
            this.questions.push(current);
            current = new Question();
            hint = false;
          }
          current.title = text;
          break;
        case '-':
          current.choices.push(text);
          hint = true;
          break;
        case '=':
          current.maxChoices = parseInt(text);
          break;
        default:
          if (hint) {
            current.hint += linePre + " ";
          } else {
            current.description += linePre + " ";
          }
          break;
      }
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  public loaded = new ReplaySubject<Questionnaire>();

  constructor(private connection: ConnectionService) {
    connection.getQuestionnaire().then((q) => {
      this.loaded.next(new Questionnaire(q));
    })
  }
}
