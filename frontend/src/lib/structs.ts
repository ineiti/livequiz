import { Blob } from "../app/services/storage.service";
import { DojoID, DojoAttemptID, QuizID, UserID } from "./ids";
import {
    JSONChoice, JSONChoiceMulti, JSONChoiceRegexp, JSONCourse, JSONCourseState,
    JSONDojo,
    JSONDojoChoice, JSONDojoAttempt, JSONQuestion, JSONQuiz
} from "./jsons";

export class Course extends Blob {
    name: string = "";
    admins: UserID[] = [];
    // TODO: make a map of students, to allow for concurrent updates.
    students: UserID[] = [];
    quizIds: QuizID[] = [];
    state: CourseState = new CourseState({});
    dojoIds: DojoID[] = [];

    override update() {
        const json: JSONCourse = JSON.parse(this.json);
        this.name = json.name!;
        this.admins = json.admins?.map((a) => UserID.fromHex(a)) ?? [];
        this.students = json.students?.map((a) => UserID.fromHex(a)) ?? [];
        this.quizIds = json.quizIds?.map((q) => QuizID.fromHex(q)) ?? [];
        this.state = new CourseState(json.state ?? { Idle: {} });
        this.dojoIds = json.dojoIds?.map((r) => DojoID.fromHex(r)) ?? [];
    }

    override toJson(): string {
        return JSON.stringify({
            name: this.name,
            admins: this.admins.map((a) => a.toHex()),
            students: this.students.map((s) => s.toHex()),
            quizIds: this.quizIds.map((q) => q.toHex()),
            state: this.state.toJson(),
            dojoIds: this.dojoIds.map((d) => d.toHex()),
        });
    }
}

export class Quiz extends Blob {
    title: string = "";
    questions: Question[] = [];

    override update() {
        const q: JSONQuiz = JSON.parse(this.json);
        this.title = q.title!;
        this.questions = q.questions?.map((q) => new Question(q)) ?? [];
    }

    override toJson(): string {
        return JSON.stringify({
            title: this.title,
            questions: this.questions.map((q) => q.toJson()),
        });
    }
}

export class Question {
    title: string;
    intro: string;
    options: Options;
    explanation: string;

    constructor(q: JSONQuestion) {
        this.title = q.title!;
        this.intro = q.intro!;
        this.options = new Options(q.options!);
        this.explanation = q.explanation!;
    }

    toJson(): JSONQuestion {
        return {
            title: this.title,
            intro: this.intro,
            options: this.options.toJson(),
            explanation: this.explanation
        }
    }
}

export class Options {
    multi?: OptionsMulti;
    regexp?: OptionRegexp;

    constructor(c: JSONChoice) {
        if (c.Multi !== undefined) {
            this.multi = new OptionsMulti(c.Multi!);
        } else {
            this.regexp = new OptionRegexp(c.Regexp!);
        }
    }

    toJson(): JSONChoice {
        if (this.multi !== undefined) {
            return {
                Multi: this.multi!.toJson()
            }
        } else {
            return {
                Regexp: this.regexp!.toJson(),
            }
        }
    }
}

export class OptionsMulti {
    correct: string[];
    wrong: string[];

    constructor(cm: JSONChoiceMulti) {
        this.correct = cm.correct!;
        this.wrong = cm.wrong!;
    }

    toJson(): JSONChoiceMulti {
        return {
            correct: this.correct,
            wrong: this.wrong,
        }
    }
}

export class OptionRegexp {
    replace: RegExp[];
    matches: RegExp[];

    constructor(cr: JSONChoiceRegexp) {
        this.replace = cr.replace!.map((r) => new RegExp(r));
        this.matches = cr.matches!.map((m) => new RegExp(m));
    }

    toJson(): JSONChoiceRegexp {
        return {
            replace: this.replace.map((r) => r.toString()),
            matches: this.matches.map((m) => m.toString()),
        }
    }
}

export enum CourseStateEnum {
    Idle,
    Quiz,
    Corrections
}

export class CourseState {
    state: CourseStateEnum;
    dojoId?: DojoID;

    constructor(cs: JSONCourseState) {
        if (cs.Quiz !== undefined) {
            this.state = CourseStateEnum.Quiz;
            this.dojoId = DojoID.fromHex(cs.Quiz!);
        } else if (cs.Corrections !== undefined) {
            this.state = CourseStateEnum.Corrections;
            this.dojoId = DojoID.fromHex(cs.Corrections);
        } else {
            this.state = CourseStateEnum.Idle;
        }
    }

    isIdle(): boolean {
        return this.state === CourseStateEnum.Idle;
    }

    isQuiz(): boolean {
        return this.state === CourseStateEnum.Quiz;
    }

    isCorrections(): boolean {
        return this.state === CourseStateEnum.Corrections;
    }

    getDojoID(): DojoID {
        if (this.state === CourseStateEnum.Idle) {
            throw new Error("Not a Quiz");
        }
        return this.dojoId!;
    }

    toJson(): JSONCourseState {
        switch (this.state) {
            case CourseStateEnum.Idle:
                return {
                    Idle: {}
                }
            case CourseStateEnum.Corrections:
                return {
                    Corrections: this.dojoId?.toHex(),
                }
            case CourseStateEnum.Quiz:
                return {
                    Quiz: this.dojoId?.toHex(),
                }
        }
    }
}

export class Dojo extends Blob {
    quizId: QuizID = new QuizID();
    results: Map<string, DojoAttemptID> = new Map();

    override update() {
        const d: JSONDojo = JSON.parse(this.json);
        this.quizId = QuizID.fromHex(d.quizId!);
        this.results = new Map(Object.entries(d.results!)
            .map(([user, result]) => [user, DojoAttemptID.fromHex(result)]));
    }

    override toJson(): string {
        const results: { [key: string]: string } = {};
        for (const [key, value] of this.results.entries()) {
            results[key] = value.toHex();
        }

        return JSON.stringify({
            quizId: this.quizId.toHex(),
            results,
        });
    }
}

export class DojoAttempt extends Blob {
    dojoId: DojoID = new DojoID();
    results: DojoChoice[] = [];

    override update() {
        const dr: JSONDojoAttempt = JSON.parse(this.json);
        this.dojoId = QuizID.fromHex(dr.dojoId!);
        this.results = dr.results?.map((r) => new DojoChoice(r)) ?? [];
    }

    override toJson(): string {
        return JSON.stringify({
            dojoId: this.dojoId.toHex(),
            results: this.results.map((r) => r.toJson()),
        });
    }
}

export class DojoChoice {
    multi?: number[];
    regexp?: string;

    constructor(dc: JSONDojoChoice) {
        if (dc.Multi !== undefined) {
            this.multi = dc.Multi!;
        } else {
            this.regexp = dc.Regexp!;
        }
    }

    toJson(): JSONDojoChoice {
        if (this.multi !== undefined) {
            return {
                Multi: this.multi!
            }
        } else {
            return {
                Regexp: this.regexp!
            }
        }
    }
}
