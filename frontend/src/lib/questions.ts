import { SelectionModel } from "@angular/cdk/collections";
import { MatListOption, MatSelectionList } from "@angular/material/list";

export interface question {
    title: string,
    description: string,
    hint: string,
    maxChoices: number,
    choices: string[],
}

function emptyQuestion(): question {
    return {
        title: "",
        description: "",
        hint: "",
        maxChoices: 0,
        choices: []
    };
}

export class Questions {
    questions: question[] = [];
    currentQuestion = 0;
    chapter = "";
    selections: boolean[][] = [];
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

    constructor(text: string) {
        let current = emptyQuestion();
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
                        this.questions.push(current);
                        this.selections.push(current.choices.map((_) => false));
                        current = emptyQuestion();
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

    updateSelection(event: MatSelectionList) {
        if (event.selectedOptions.selected.length > this.maxChoices) {
            event.selectedOptions.selected[0].toggle();
        }
        this.selections[this.currentQuestion] = this.selections[this.currentQuestion].map((_, i) => {
            return event.selectedOptions.selected.some((sel) => sel.value === i);
        })
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