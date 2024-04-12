import { Secret } from './ids';
import { Course, Dojo, DojoAttempt, Quiz } from './structs';
import { Blob, BlobID, JSONBlobUpdateReply, JSONBlobUpdateRequest } from '../app/services/storage.service';

export class ConnectionMock {
    blobs: Map<string, Blob> = new Map();

    constructor() {
    }

    async getBlobUpdates(updates: JSONBlobUpdateRequest): Promise<JSONBlobUpdateReply> {
        console.log(updates);
        const reply: JSONBlobUpdateReply = { blobData: {} };
        for (const [k, v] of [...Object.entries(updates.blobVersions)]) {
            if (v.version === 1 && this.blobs.has(k)) {
                reply.blobData[k] = this.blobs.get(k)!;
            }
        }
        return Promise.resolve(reply);
    }

    initBasic(secret: Secret) {
        const quiz_id = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
        const quiz = new Quiz(BlobID.fromHex(quiz_id));
        quiz.json = JSON.stringify({
            title: "Quizzy the quiz",
            questions: [
                {
                    title: "1st",
                    intro: "what is your first choice?",
                    choice: {
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
                    choice: {
                        Regexp: {
                            replace: ["s/ +/ /"],
                            matches: ["/one/i", "/two/i"],
                        }
                    },
                    explanation: "sounds great",
                },
            ]
        });
        this.blobs.set(quiz_id, quiz);

        const dojo_id = "0000000000000000111111111111111122222222222222223333333333333333";
        const dojo_result_id = "3333333333333333222222222222222211111111111111110000000000000000";
        const dojoAttempt = new DojoAttempt(BlobID.fromHex(dojo_result_id));
        dojoAttempt.json = JSON.stringify({
            dojo_id,
            results: [{ Multi: [0, 2] },
            { Regexp: "one" }],
        });
        dojoAttempt.update();
        this.blobs.set(dojo_result_id, dojoAttempt);

        const dojo = new Dojo(BlobID.fromHex(dojo_id));
        dojo.json = JSON.stringify({
            quiz_id: quiz.id.toHex(),
            results: Object.fromEntries([[secret.hash().toHex(), dojoAttempt.id.toHex()]]),
        });
        dojo.update();
        this.blobs.set(dojo_id, dojo);

        const course_id1 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const course1 = new Course(BlobID.fromHex(course_id1));
        course1.json = JSON.stringify({
            name: 'Test',
            admins: [secret.hash().toHex()],
            students: [],
            quiz_ids: [quiz.id.toHex()],
            state: { Idle: {} },
            dojo_ids: [dojo_id],
        });
        course1.update();
        this.blobs.set(course_id1, course1);

        const course_id2 = "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const course2 = new Course(BlobID.fromHex(course_id2));
        course2.json = JSON.stringify({
            name: 'Test Student',
            admins: [],
            students: [secret.hash().toHex()],
            quiz_ids: [quiz.id.toHex()],
            state: { Quiz: quiz.id.toHex() },
            dojo_ids: [dojo_id],
        });
        course2.update();
        this.blobs.set(course_id2, course2);
    }
}
