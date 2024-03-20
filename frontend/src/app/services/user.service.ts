import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';
import { Question, QuestionnaireService } from './questionnaire.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  secret = Buffer.alloc(32);
  name = "undefined";
  selectedStorage: boolean[][] = [];
  regexpStorage: string[] = [];
  selectionStorageName = "user-selection";
  regexpStorageName = "user-regexp";

  constructor(private connection: ConnectionService, private questionnaire: QuestionnaireService) {
    questionnaire.loaded.subscribe((qst) => {
      this.selectedStorage = qst.questions.map((q) => q.choices.map(() => false));
      this.selectionStorageName = `user-selection-${qst.chapter}`;
      this.regexpStorageName = `user-regexp-${qst.chapter}`;
      this.init();
    })
  }

  async init() {
    const user_secret = localStorage.getItem('user-secret');
    if (user_secret === null) {
      self.crypto.getRandomValues(this.secret);
      localStorage.setItem('user-secret', this.secret.toString('hex'));
    } else {
      this.secret = Buffer.from(user_secret, 'hex');
    }

    const name = localStorage.getItem('user-name');
    if (name === null) {
      this.name = uniqueNamesGenerator({
        dictionaries: [colors, animals],
        separator: '-',
      });
    } else {
      this.name = name;
    }

    const selStorage = localStorage.getItem(this.selectionStorageName);
    if (selStorage !== null) {
      this.selectedStorage = JSON.parse(selStorage);
    }

    const regStorage = localStorage.getItem(this.regexpStorageName);
    if (regStorage !== null) {
      this.regexpStorage = JSON.parse(regStorage);
    }

    this.updateName();
  }

  updateName() {
    localStorage.setItem('user-name', this.name);
    this.connection.updateName(this.secret, this.name);
  }

  question(question: number): Question {
    return this.questionnaire.loaded.value.questions[question];
  }

  updateSelections(question: number, selected: boolean[]) {
    this.selectedStorage[question] = this.question(question).shuffledToOrig(selected);
    localStorage.setItem(this.selectionStorageName, JSON.stringify(this.selectedStorage));
    this.connection.updateQuestion(this.secret, question,
      this.question(question).resultShuffled(selected),
      this.question(question).shuffledToOrig(selected).map((s, i) => s ? i : -1).filter((i) => i >= 0));
  }

  getSelections(question: number): boolean[] {
    if (question > this.selectedStorage.length) {
      return [];
    }
    return this.question(question).origToShuffled(this.selectedStorage[question]);
  }

  updateRegexp(question: number, reg: string) {
    this.regexpStorage[question] = reg;
    localStorage.setItem(this.regexpStorageName, JSON.stringify(this.regexpStorage));
    const result = this.question(question).resultRegexp(reg);
    this.connection.updateQuestion(this.secret, question, result, result === "correct" ? [0] : []);
  }

  getRegexp(question: number): string {
    if (question > this.regexpStorage.length) {
      return "";
    }
    return this.regexpStorage[question] ?? "";
  }

  secretHex(): string {
    return this.secret.toString('hex');
  }
}
