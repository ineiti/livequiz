import { Buffer } from 'buffer';
import { JSONNomadUpdateReply, JSONNomadUpdateRequest } from './storage';

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

    async getNomadUpdates(updates: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply> {
        throw new Error("Not implemented yet");
    }
}

