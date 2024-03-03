import { Buffer } from 'buffer';
import { QuestionsService } from '../app/questions.service';

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
        if (res.array === undefined){
            res.array = [];
        }
        return res;
    }
}

interface UserAnswers {
    secret: Buffer,
    result: Result,
}

export class ConnectionMock {
    users = new Map<string, UserAnswers>();

    constructor(private questions: QuestionsService) {
    }

    getUser(secret: Buffer): UserAnswers {
        let user = this.users.get(secret.toString('hex'));
        if (user === undefined) {
            user = {
                secret: secret,
                result: {
                    name: "unknown",
                    answers: Array(this.questions.questions.length).map(() => "empty")
                },
            }
        }
        return user;
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
}