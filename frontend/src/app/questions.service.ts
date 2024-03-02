import { Injectable } from '@angular/core';
import { MatSelectionList } from "@angular/material/list";

export class question {
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

  correct(selected: number[]): boolean {
    return selected
      .filter((s) => this.solution[s])
      .length === this.maxChoices
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

  questions: question[] = [];
  currentQuestion = 0;
  chapter = "";
  selections: boolean[][] = [];
  done: boolean[] = [];
  empty = true;

  title = "undefined";
  first = false;
  last = false;
  percentage = 0;
  description = "undefined";
  maxChoices = 0;
  choices: string[] = [""];
  selected: boolean[] = [];
  hint = "";

  constructor() {
    this.getQuestions().then((text) => this.parseQuestions(text));
  }

  async getQuestions(): Promise<string> {
    const response = await fetch("./assets/questions.md");
    return await response.text();
  }

  parseQuestions(text: string) {
    let current = new question();
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
            this.empty = false;
            current.shuffle();
            this.questions.push(current);
            this.selections.push(current.choices.map((_) => false));
            this.done.push(false);
            current = new question();
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
    this.update();
  }

  next() {
    if (!this.last) {
      this.currentQuestion++;
    }
    this.update();
  }

  previous() {
    if (!this.first) {
      this.currentQuestion--;
    }
    this.update();
  }

  goto(q: number) {
    if (q >= 0 && q < this.questions.length) {
      this.currentQuestion = q;
    }
    this.update();
  }

  updateSelection(event: MatSelectionList) {
    const selected = event.selectedOptions.selected.length;
    if (selected > this.maxChoices) {
      event.selectedOptions.selected[0].toggle();
    } else if (selected === this.maxChoices) {
      this.done[this.currentQuestion] = true;
    } else if (selected < this.maxChoices) {
      this.done[this.currentQuestion] = false;
    }
    this.selections[this.currentQuestion] = this.selections[this.currentQuestion].map((_, i) => {
      return event.selectedOptions.selected.some((sel) => sel.value === i);
    });
    this.update();
  }

  update() {
    this.first = this.currentQuestion === 0;
    if (this.questions.length > 0) {
      this.last = this.currentQuestion === this.questions.length - 1;
      this.percentage = 100 * (this.currentQuestion + 1) / this.questions.length;
      const cq = this.questions[this.currentQuestion];
      this.description = cq.description;
      this.maxChoices = cq.maxChoices;
      this.choices = cq.choices;
      this.selected = this.selections[this.currentQuestion];
      this.hint = cq.hint;
      this.title = cq.title;
    }
  }
}
