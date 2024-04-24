import { Subscription } from "rxjs";
import { LivequizStorageService } from "../app/services/livequiz-storage.service";
import { StorageService } from "../app/services/storage.service";
import { DojoID, NomadID } from "./ids";
import { Dojo, DojoAttempt, DojoChoice, Quiz } from "./structs";
import { User } from "../app/services/user.service";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { Answer } from "../app/course/dojo/quiz/quiz.component";

export class ResultsSummaryContainer {
    // Wheter a student clicked any of the boxes or entered some text
    answered: boolean[][] = [];
    // The scores [user][question]
    scores: number[][] = [];
    // How many chose [question][option].
    chosen: number[][] = [];
    // The wrong regexp answers from the [question][wrong], with the replace regexps applied.
    texts: string[][] = [];

    updateAttempts(quiz: Quiz, attempts: DojoAttempt[]) {
        const resultss = attempts.map((a) => a.choicesFilled(quiz.questions));
        this.answered = resultss.map((results) =>
            results.map((result) =>
                result.isAnswered()));

        const scoSta = resultss.map((results) =>
            quiz.questions.map((question, i) =>
                question.options.scoreStats(results[i])
            ));
        this.scores = scoSta.map((sco) => sco.map((s) => s.score));
        if (scoSta.length > 0) {
            this.chosen = scoSta.map((sco) => sco.map((s) => s.stats))
                .reduce((prev, curr) =>
                    prev.map((q, i) => q.map((o, j) => o + curr[i][j])));
        }
        this.texts = quiz.questions.map((question, i) =>
            question.options.regexp ?
                resultss
                    .filter((results) =>
                        results[i].regexp! != '' && !question.options.regexp!.isCorrect(results[i].regexp!))
                    .map((results) => question.options.regexp!.applyReplace(results[i].regexp!)) : []);
    }
}

export class ResultsSummary extends ResultsSummaryContainer {
    dojo!: Dojo;
    quiz!: Quiz;

    attempts: DojoAttempt[] = [];

    updates: Subscription;

    users: User[] = [];
    constructor(private storage: StorageService,
        private livequiz: LivequizStorageService,
        private dojoId: DojoID) {
        super();
        this.updates = storage.updateObserver.subscribe((ids) => this.updateIds(ids));
    }

    async init() {
        this.dojo = await this.livequiz.getDojo(this.dojoId!);
        this.quiz = await this.livequiz.getQuiz(this.dojo.quizId);
        this.updateDojo();
    }

    deInit() {
        this.updates.unsubscribe();
    }

    updateIds(ids: NomadID[]) {
        if (this.dojo !== undefined) {
            if (this.dojo.id.isIn(ids)) {
                this.updateDojo();
            } else if ([...this.dojo.attempts.values()].some((id) => id.isIn(ids))) {
                this.updateAttempts(this.quiz, this.attempts);
            }
        }
    }

    async updateDojo() {
        this.attempts = await this.dojo.getAttempts(this.storage);
        this.users = await this.dojo.getUsers(this.storage);
        this.updateAttempts(this.quiz, this.attempts);
    }

    async subscribe(observer: (() => void)): Promise<Subscription> {
        throw new Error("Not yet implemented");
    }

    async addUser() {
        const user = new User();
        user.name = uniqueNamesGenerator({
            dictionaries: [colors, animals],
            separator: '-',
        });
        const attempt = new DojoAttempt();
        attempt.dojoId = this.dojo.id;
        for (const question of this.quiz.questions) {
            if (question.options.multi !== undefined) {
                const choice = new DojoChoice({ Multi: [] });
                const answer = new Answer(question, choice, user.id)
                const selections = Math.floor(Math.random() * (question.options.multi.total() + 1));
                answer.updateSelection([...new Array(selections)].map((_, i) => { return { value: i } }));
                attempt.choices.push(choice);
            } else {
                const choice = new DojoChoice({ Regexp: "" });
                if (Math.random() > 0.5) {
                    const m = Math.floor(Math.random() * (question.options.regexp!.match.length));
                    choice.regexp = question.options.regexp!.match[m].toString();
                } else {
                    choice.regexp = uniqueNamesGenerator({
                        dictionaries: [colors, animals],
                        separator: '-',
                    });
                }
                attempt.choices.push(choice);
            }
        }
        this.dojo.attempts.set(user.id.toHex(), attempt.id);
        this.storage.addNomads(user, attempt);
    }
}