import { Injectable } from '@angular/core';
import { ConnectionService, ResultState } from './connection.service';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

export enum QuestionType {
  Single = 0,
  Multi = 1,
  Regexp = 2,
}

export class Question {
  title: string = ""
  description: string = ""
  hint: string = ""
  maxChoices: number = 0
  replace: string[] = []
  choices: string[] = []
  original: number[] = []
  qType: QuestionType = QuestionType.Single;

  addChoice(choice: string) {
    this.original.push(this.choices.length);
    if (this.qType !== QuestionType.Regexp) {
      this.choices.push(choice);
    } else {
      const r = choice.match(/\/(.*)\//);
      if (r?.length === 2) {
        this.choices.push(r[1]);
      } else {
        this.choices.push(choice);
      }
    }
  }

  shuffle() {
    for (let i = this.choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]];
      [this.original[i], this.original[j]] = [this.original[j], this.original[i]];
    }
  }

  resultOrig(selected: boolean[]): ResultState {
    if (selected.length === 0) {
      return "empty";
    }
    return selected
      .filter((s, i) => s && (i < this.maxChoices))
      .length === this.maxChoices ? "correct" : "answered";
  }

  resultShuffled(selected: boolean[]): ResultState {
    return this.resultOrig(this.shuffledToOrig(selected));
  }

  resultRegexp(reg: string): ResultState {
    if (this.qType !== QuestionType.Regexp) {
      throw new Error("Not a regexp question");
    }
    if (reg === "") {
      return "empty";
    }
    for (const r of this.choices) {
      if (new RegExp(r).test(reg)) {
        return "correct";
      }
    }
    return "answered";
  }

  origToShuffled(selected: boolean[]): boolean[] {
    return this.original.map((t) => selected[t]);
  }

  shuffledToOrig(selected: boolean[]): boolean[] {
    let ret: boolean[] = [];
    this.original.map((t, o) => ret[t] = selected[o]);
    return ret;
  }

  choicesOrig(): string[] {
    let ret: string[] = [];
    this.original.map((t, o) => ret[t] = this.choices[o]);
    return ret;
  }

  correct(): number[] {
    return this.original.map((o, i) => [o, i]).filter((oi) => oi[0] < this.maxChoices).map((oi) => oi[1])
  }

  scoreOrig(selected: number[]): number {
    selected.sort();
    return selected
      .map<number>((s) => s < this.maxChoices ? 1 : -1)
      .reduce((prev, cur) => prev + cur, 0)
      / this.maxChoices;
  }
}

export class Questionnaire {
  questions: Question[] = [];
  chapter = "";

  constructor(private text: string) {
    let current = new Question();
    let hint = false;
    for (const line of text.split("\n")) {
      if (line.length === 0) {
        continue;
      }
      const linePre = line.replace(/`(.*?)`/g, "<span class='pre'>$1</span>");
      const interpret = linePre.match(/([#=~-]*) *(.*)/);
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
            this.questions.push(current);
            current = new Question();
            hint = false;
          }
          current.title = text;
          break;
        case '-':
          current.addChoice(text);
          hint = true;
          break;
        case '~':
          current.qType = QuestionType.Regexp;
          current.maxChoices = 1;
          const res = text.match(/s\/(.*[^\\])\/(.*)\//);
          if (res === null || res?.length !== 3) {
            console.warn(`Couldn't parse -${text}- as s/search/replace/`);
            continue;
          }
          current.replace = res!.slice(1, 3);
          break;
        case '=':
          current.maxChoices = parseInt(text);
          current.qType = current.maxChoices > 1 ? QuestionType.Multi : QuestionType.Single;
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

  shuffle() {
    for (const question of this.questions) {
      question.shuffle();
    }
  }

  clone(): Questionnaire {
    const quest = new Questionnaire(this.text);
    for (let i = 0; i < this.questions.length; i++) {
      quest.questions[i].choices = this.questions[i].choices;
      quest.questions[i].original = this.questions[i].original;
    }
    return quest;
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {
  public loaded = new BehaviorSubject<Questionnaire>(new Questionnaire(""));
  hash = "";

  constructor(private connection: ConnectionService) {
    connection.quizHash.subscribe((nh) => {
      if (nh !== this.hash) {
        this.hash = nh;
        // connection.getQuestionnaire().then((q) => {
        //   const quest = new Questionnaire(q);
        //   quest.shuffle();
        //   this.loaded.next(quest);
        // })
      }
    })
  }
}
