import { Blob } from "../app/services/storage.service";
import { DojoID, DojoResultID, QuizID, UserID } from "./ids";
import {
    JSONChoice, JSONChoiceMulti, JSONChoiceRegexp, JSONCourse, JSONCourseState,
    JSONDojo,
    JSONDojoChoice, JSONDojoResult, JSONQuestion, JSONQuiz
} from "./jsons";

export class Course extends Blob {
    name: string = "";
    admins: UserID[] = [];
    students: UserID[] = [];
    quiz_ids: QuizID[] = [];
    state: CourseState = new CourseState({});
    dojo_ids: DojoID[] = [];

    override update() {
        const json: JSONCourse = JSON.parse(this.json);
        this.name = json.name!;
        this.admins = json.admins?.map((a) => UserID.from_hex(a)) ?? [];
        this.students = json.students?.map((a) => UserID.from_hex(a)) ?? [];
        this.quiz_ids = json.quiz_ids?.map((q) => QuizID.from_hex(q)) ?? [];
        this.state = new CourseState(json.state ?? { Idle: {} });
        this.dojo_ids = json.dojo_ids?.map((r) => DojoID.from_hex(r)) ?? [];
    }

    override toJson(): string {
        return JSON.stringify({
            name: this.name,
            id: this.id.to_hex(),
            admins: this.admins.map((a) => a.to_hex()),
            students: this.students.map((s) => s.to_hex()),
            quiz_ids: this.quiz_ids.map((q) => q.to_hex()),
            state: this.state.to_json(),
            dojo_ids: this.dojo_ids.map((d) => d.to_hex()),
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
            id: this.id.to_hex(),
            title: this.title,
            questions: this.questions.map((q) => q.to_json()),
        });
    }
}

export class Question {
    title: string;
    intro: string;
    choice: Choice;
    explanation: string;

    constructor(q: JSONQuestion) {
        this.title = q.title!;
        this.intro = q.intro!;
        this.choice = new Choice(q.choice!);
        this.explanation = q.explanation!;
    }

    to_json(): JSONQuestion {
        return {
            title: this.title,
            intro: this.intro,
            choice: this.choice.to_json(),
            explanation: this.explanation
        }
    }
}

export class Choice {
    multi?: ChoiceMulti;
    regexp?: ChoiceRegexp;

    constructor(c: JSONChoice) {
        if (c.Multi !== undefined) {
            this.multi = new ChoiceMulti(c.Multi!);
        } else {
            this.regexp = new ChoiceRegexp(c.Regexp!);
        }
    }

    to_json(): JSONChoice {
        if (this.multi !== undefined) {
            return {
                Multi: this.multi!.to_json()
            }
        } else {
            return {
                Regexp: this.regexp!.to_json(),
            }
        }
    }
}

export class ChoiceMulti {
    correct: string[];
    wrong: string[];

    constructor(cm: JSONChoiceMulti) {
        this.correct = cm.correct!;
        this.wrong = cm.wrong!;
    }

    to_json(): JSONChoiceMulti {
        return {
            correct: this.correct,
            wrong: this.wrong,
        }
    }
}

export class ChoiceRegexp {
    replace: RegExp[];
    matches: RegExp[];

    constructor(cr: JSONChoiceRegexp) {
        this.replace = cr.replace!.map((r) => new RegExp(r));
        this.matches = cr.matches!.map((m) => new RegExp(m));
    }

    to_json(): JSONChoiceRegexp {
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
    id?: DojoID;

    constructor(cs: JSONCourseState) {
        if (cs.Quiz !== undefined) {
            this.state = CourseStateEnum.Quiz;
            this.id = DojoID.from_hex(cs.Quiz!);
        } else if (cs.Corrections !== undefined) {
            this.state = CourseStateEnum.Corrections;
            this.id = DojoID.from_hex(cs.Corrections);
        } else {
            this.state = CourseStateEnum.Idle;
        }
    }

    is_idle(): boolean {
        return this.state === CourseStateEnum.Idle;
    }

    is_quiz(): boolean {
        return this.state === CourseStateEnum.Quiz;
    }

    is_corrections(): boolean {
        return this.state === CourseStateEnum.Corrections;
    }

    dojo_id(): DojoID {
        if (this.state === CourseStateEnum.Idle) {
            throw new Error("Not a Quiz");
        }
        return this.id!;
    }

    to_json(): JSONCourseState {
        switch (this.state) {
            case CourseStateEnum.Idle:
                return {
                    Idle: {}
                }
            case CourseStateEnum.Corrections:
                return {
                    Corrections: this.id?.to_hex(),
                }
            case CourseStateEnum.Quiz:
                return {
                    Quiz: this.id?.to_hex(),
                }
        }
    }
}

export class Dojo extends Blob {
    quiz_id: QuizID = new QuizID();
    results: Map<string, DojoResultID> = new Map();

    override update() {
        const d: JSONDojo = JSON.parse(this.json);
        this.quiz_id = QuizID.from_hex(d.quiz_id!);
        this.results = new Map(Object.entries(d.results!)
            .map(([user, result]) => [user, DojoResultID.from_hex(result)]));
    }

    override toJson(): string {
        const results: { [key: string]: string } = {};
        for (const [key, value] of this.results.entries()) {
            results[key] = value.to_hex();
        }

        return JSON.stringify({
            quiz_id: this.quiz_id.to_hex(),
            results,
        });
    }
}

export class DojoResult extends Blob {
    dojo_id: DojoID = new DojoID();
    results: DojoChoice[] = [];

    override update() {
        const dr: JSONDojoResult = JSON.parse(this.json);
        this.dojo_id = QuizID.from_hex(dr.dojo_id!);
        this.results = dr.results?.map((r) => new DojoChoice(r)) ?? [];
    }

    override toJson(): string {
        return JSON.stringify({
            id: this.id.to_hex(),
            dojo_id: this.dojo_id.to_hex(),
            results: this.results.map((r) => r.to_json()),
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

    to_json(): JSONDojoChoice {
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
