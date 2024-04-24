import { Question } from "./structs";

export class NewQuestion {
    static createMulti(title: string, intro: string, explanation: string,
        correct: string[], wrong: string[]): Question {
        return new Question({
            title, intro, explanation,
            options: { Multi: { correct, wrong } }
        });
    }

    static createRegexp(title: string, intro: string, explanation: string,
        replace: string[], match: string[]): Question {
        return new Question({
            title, intro, explanation,
            options: { Regexp: { replace, match } }
        });
    }
}