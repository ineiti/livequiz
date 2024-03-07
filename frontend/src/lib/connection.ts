import { Buffer } from 'buffer';
import { AnswerService } from '../app/services/answer.service';
import { Questionnaire } from '../app/services/questionnaire.service';

export type ResultState = ("correct" | "answered" | "empty")

export interface Result {
    name: string,
    answers: ResultState[],
}

export class Connection {
    constructor(private url: string) {
    }

    async updateQuestion(secret: Buffer, question: number, result: ResultState) {
        await fetch(`${this.url}/api/v1/updateQuestion?secret=${secret.toString('hex')}&` +
            `question=${question}&selected=${result}`);
    }

    async updateName(secret: Buffer, name: string) {
        await fetch(`${this.url}/api/v1/updateName?secret=${secret.toString('hex')}&` +
            `name=${name}`);
    }

    async getResults(): Promise<Result[]> {
        const result = await fetch(`${this.url}/api/v1/getResults`);
        let res = await result.json();
        if (res.array === undefined) {
            res.array = [];
        }
        return res;
    }

    async getQuestionnaire(): Promise<string> {
        const response = await fetch(`${this.url}/api/v1/getQuestionnaire`);
        return await response.text();
    }

    async updateQuestionnaire(secret: Buffer) {
        await fetch(`${this.url}/api/v1/updateQuestionnaire?secret=${secret.toString('hex')}`);
    }

    async getShowAnswers(): Promise<boolean> {
        const response = await (await fetch(`${this.url}/api/v1/getShowAnswers`)).text();
        return response === "true";
    }

    async setShowAnswers(secret: string, show: boolean) {
        await fetch(`${this.url}/api/v1/setShowAnswers?secret=${secret}&show=${show}`)
    }

}

interface UserAnswers {
    secret: Buffer,
    result: Result,
}

export class ConnectionMock {
    users = new Map<string, UserAnswers>();
    show_answers = false;
    questionnaire = new Questionnaire("");

    constructor() {
        this.getQuestionnaire().then((text) => this.questionnaire = new Questionnaire(text));
    }

    getUser(secret: Buffer): UserAnswers {
        let user = this.users.get(secret.toString('hex'));
        if (user === undefined) {
            user = {
                secret: secret,
                result: {
                    name: "unknown",
                    answers: Array(this.questionnaire.questions.length).map(() => "empty")
                },
            }
        }
        return user;
    }

    async updateQuestionnaire(secret: Buffer) {
    }

    async updateQuestion(secret: Buffer, question: number, result: ResultState) {
        const user = this.getUser(secret);
        user.result.answers[question] = result;
        this.users.set(secret.toString('hex'), user);
    }

    async updateName(secret: Buffer, name: string) {
        const user = this.getUser(secret);
        user.result.name = name;
        this.users.set(secret.toString('hex'), user);
    }

    async getResults(): Promise<Result[]> {
        return [...this.users].map(([_, u]) => { return { name: u.result.name, answers: u.result.answers } });
    }

    async getQuestionnaire(): Promise<string> {
        const response = await fetch("./assets/questions.md");
        return await response.text();
    }

    async getShowAnswers(): Promise<boolean> {
        return this.show_answers;
    }

    async setShowAnswers(secret: string, show: boolean) {
        this.show_answers = show;
    }
}