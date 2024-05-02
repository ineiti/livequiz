import { Buffer } from 'buffer';
import { JSONNomadUpdateReply, JSONNomadUpdateRequest } from './storage';
import { UserService } from '../app/services/user.service';
import { Secret } from './ids';

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
    constructor(private url: string, private secret: Secret) {
    }

    async reset() {
        await fetch(`${this.url}/api/v2/reset`);
    }

    async getNomadUpdates(updates: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply> {
        const repl = await fetch(`${this.url}/api/v2/nomadUpdates`,
            {
                method: "POST",
                headers: {
                    "x-secret-key": this.secret.toHex(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
                mode: "cors", // no-cors, *cors, same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached            
            });
        return await repl.json();
    }
}

