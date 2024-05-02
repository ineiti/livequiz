import { Secret } from './ids';
import { Dojo, DojoAttempt, Quiz } from "./structs";
import { Course } from "./structs";
import { JSONNomadUpdateReply, JSONNomadUpdateRequest } from './storage';
import { Nomad } from "./storage";
import { NomadID } from "./ids";
import { UserService } from '../app/services/user.service';

export class ConnectionMock {
    nomads: Map<string, Nomad> = new Map();

    constructor() {
    }

    async reset() {
        this.nomads.clear();
    }

    async getNomadUpdates(updates: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply> {
        // console.log('Mock connection:', [...Object.entries(updates.nomadVersions)].map(([k, v]) =>
        //     `${k.slice(0, 8)}: ${v.version}`).join(" ; "));
        const reply: JSONNomadUpdateReply = { nomadData: {} };
        for (const [k, v] of [...Object.entries(updates.nomadVersions)]) {
            if (this.nomads.has(k) && v.version < this.nomads.get(k)!.version) {
                reply.nomadData[k] = this.nomads.get(k)!.getReply();
            }
        }
        // console.log('Mock reply:', [...Object.entries(reply.nomadData)].map(([k, v]) =>
        //     `${k.slice(0, 8)}: ${v.version}`).join(" ; "));
        return Promise.resolve(reply);
    }

    initBasic(user: UserService) {
        const quizId = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
        const quiz = new Quiz(NomadID.fromHex(quizId));
        quiz.json = JSON.stringify({
            title: "Quizzy the quiz",
            questions: [
                {
                    title: "1st",
                    intro: "what is your first choice?",
                    options: {
                        Multi: {
                            correct: ["one", "two"],
                            wrong: ["three", "four"],
                        }
                    },
                    explanation: "sounds great",
                },
                {
                    title: "2nd",
                    intro: "what is your second choice?",
                    options: {
                        Multi: {
                            correct: ["eins", "zwei"],
                            wrong: ["drei", "vier"],
                        }
                    },
                    explanation: "sounds great",
                },
                {
                    title: "3rd",
                    intro: "what is your third choice?",
                    options: {
                        Multi: {
                            correct: ["1"],
                            wrong: ["2", "3", "4"],
                        }
                    },
                    explanation: "sounds great",
                },
                {
                    title: "4th",
                    intro: "what is your fourth choice?",
                    options: {
                        Regexp: {
                            replace: ["s/ +/ /"],
                            match: ["/one/i", "/two/i"],
                        }
                    },
                    explanation: "sounds great",
                },
            ]
        });
        quiz.update();
        this.nomads.set(quizId, quiz);

        const dojoId = "0000000000000000111111111111111122222222222222223333333333333333";
        const dojoAttemptId = "3333333333333333222222222222222211111111111111110000000000000000";
        const dojoAttempt = new DojoAttempt(NomadID.fromHex(dojoAttemptId));
        dojoAttempt.json = JSON.stringify({
            dojoId,
            choices: [
                { Multi: [0, 2] },
                { Multi: [1, 3] },
                { Multi: [1] },
                { Regexp: "one" }
            ],
        });
        dojoAttempt.update();
        this.nomads.set(dojoAttemptId, dojoAttempt);

        const dojo = new Dojo(NomadID.fromHex(dojoId));
        dojo.json = JSON.stringify({
            quizId: quizId,
            attempts: Object.fromEntries([[user.id.toHex(), dojoAttempt.id.toHex()]]),
        });
        dojo.update();
        this.nomads.set(dojoId, dojo);

        const courseId1 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const course1 = new Course(NomadID.fromHex(courseId1));
        course1.json = JSON.stringify({
            name: 'Test',
            admins: [user.id.toHex()],
            students: [],
            quizIds: [quiz.id.toHex()],
            state: { Idle: {} },
            dojoIds: [dojoId],
        });
        course1.update();
        this.nomads.set(courseId1, course1);

        const courseId2 = "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const course2 = new Course(NomadID.fromHex(courseId2));
        course2.json = JSON.stringify({
            name: 'Test Student',
            admins: [],
            students: [user.id.toHex()],
            quizIds: [quiz.id.toHex()],
            state: { Quiz: dojo.id.toHex() },
            dojoIds: [dojoId],
        });
        course2.update();
        this.nomads.set(courseId2, course2);

        const courseId3 = "2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const course3 = new Course(NomadID.fromHex(courseId3));
        course3.json = JSON.stringify({
            name: 'Test Corrections',
            admins: [user.id.toHex()],
            students: [user.id.toHex()],
            quizIds: [quiz.id.toHex()],
            state: { Corrections: dojo.id.toHex() },
            dojoIds: [dojoId],
        });
        course3.update();
        this.nomads.set(courseId3, course3);

        for (const [_, v] of [...this.nomads.entries()]) {
            v.version = 1;
        }

        user.courses.set(course1.id.toHex(), course1.name);
        user.courses.set(course2.id.toHex(), course2.name);
        user.courses.set(course3.id.toHex(), course3.name);
    }
}
