import { Buffer } from 'buffer';
import { Questionnaire } from '../app/services/questionnaire.service';
import { sha256 } from 'js-sha256';
import { Result, ResultState, Stats } from '../app/services/connection.service';

export interface JSONResult {
    name?: string,
    answers?: string[],
    choices?: number[][],
}

export interface JSONStats {
    showResults?: boolean,
    editAllowed?: boolean,
    quizHash?: string,
    answersHash?: string,
}

export class Connection {
    constructor(private url: string) {
    }

    async updateQuestion(secret: Buffer, question: number, result: ResultState, choices: number[]) {
        const choicesStr = choices.length > 0 ? `&choices=${choices.join("&choices=")}` : '';
        await fetch(`${this.url}/api/v1/updateQuestion?secret=${secret.toString('hex')}&` +
            `question=${question}&selected=${result}${choicesStr}`);
    }

    async updateName(secret: Buffer, name: string) {
        await fetch(`${this.url}/api/v1/updateName?secret=${secret.toString('hex')}&` +
            `name=${name}`);
    }

    async getResults(): Promise<JSONResult[]> {
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

    async setShowAnswers(secret: Buffer, show: boolean) {
        await fetch(`${this.url}/api/v1/setShowAnswers?secret=${secret.toString('hex')}&show=${show}`)
    }

    async setEditAllowed(secret: Buffer, edit: boolean) {
        await fetch(`${this.url}/api/v1/setEditAllowed?secret=${secret.toString('hex')}&edit=${edit}`)
    }

    async getStats(): Promise<JSONStats> {
        return await (await fetch(`${this.url}/api/v1/getStats`)).json();
    }

    async isAdmin(secret: Buffer): Promise<boolean> {
        return await (await fetch(`${this.url}/api/v1/getIsAdmin?secret=${secret.toString('hex')}`)).json();
    }
}

interface UserAnswers {
    secret: Buffer,
    result: Result,
}

export class ConnectionMock {
    users = new Map<string, UserAnswers>();
    questionnaire = new Questionnaire("");
    stats = new Stats({});

    constructor() {
        this.getQuestionnaire().then((text) => {
            this.stats.quizHash = sha256(text);
            this.questionnaire = new Questionnaire(text);
        });
        (window as any).stats = this.stats;
    }

    getUser(secret: Buffer): UserAnswers {
        let user = this.users.get(secret.toString('hex'));
        if (user === undefined) {
            user = {
                secret: secret,
                result: {
                    name: "unknown",
                    answers: Array(this.questionnaire.questions.length).map(() => "empty"),
                    choices: [],
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
        const hash = sha256.create();
        for (const user of this.users) {
            hash.update(user[0]);
            hash.update(user[1].secret);
            hash.update(user[1].result.name);
            for (const answer in user[1].result.answers) {
                hash.update(answer);
            }
        }
        this.stats.answersHash = hash.hex();
    }

    async updateName(secret: Buffer, name: string) {
        const user = this.getUser(secret);
        user.result.name = name;
        this.users.set(secret.toString('hex'), user);
    }

    async getResults(): Promise<JSONResult[]> {
        return [...this.users].map(([_, u]) => { return { name: u.result.name, answers: u.result.answers } });
    }

    async getQuestionnaire(): Promise<string> {
        const response = await fetch("./assets/questions.md");
        return await response.text();
    }

    async setShowAnswers(secret: string, show: boolean) {
        this.stats.showResults = show;
    }

    async setEditAllowed(secret: string, edit: boolean) {
        this.stats.editAllowed = edit;
    }

    async getStats(): Promise<JSONStats> {
        return this.stats;
    }

    async isAdmin(secret: string): Promise<boolean> {
        return true;
    }
}