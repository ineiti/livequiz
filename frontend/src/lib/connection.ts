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

