import { ReplaySubject, Subscription } from "rxjs";
import { UserID, QuizID, DojoID, DojoAttemptID, NomadID } from "./ids";
import { JSONCourse, JSONQuiz, JSONQuestion, JSONChoice, JSONChoiceMulti as JSONOptionMulti, JSONChoiceRegexp as JSONOptionRegexp, JSONCourseState, JSONDojo, JSONDojoAttempt, JSONDojoChoice } from "./jsons";
import { Nomad } from "./storage";
import { User } from "../app/services/user.service";
import { StorageService } from "../app/services/storage.service";

export class Course extends Nomad {
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

export class Quiz extends Nomad {
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
    };
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

  size(): number {
    return this.regexp !== undefined ? 1 : this.multi!.total();
  }

  isCorrect(choice: DojoChoice): boolean[] {
    if (this.multi !== undefined) {
      return this.multi!.correct.concat(this.multi!.wrong).map((_, i) =>
        choice.multi!.includes(i) && i < this.multi!.correct.length
      );
    }
    return [this.regexp!.isCorrect(choice.regexp!)];
  }

  toJson(): JSONChoice {
    if (this.multi !== undefined) {
      return {
        Multi: this.multi!.toJson()
      };
    } else {
      return {
        Regexp: this.regexp!.toJson(),
      };
    }
  }

  scoreStats(choice: DojoChoice): { score: number, stats: number[] } {
    if (this.regexp !== undefined) {
      if (choice.regexp === undefined){
        return {score: 0, stats: []};
      }
      const result = this.regexp.matches(choice.regexp!);
      const stats = this.regexp.match.map((_, i) => i == result ? 1 : 0);
      return { score: result >= 0 ? 1 : 0, stats };
    }
    let score = 0;
    let stats: number[] = [];
    for (let i = 0; i < this.multi!.total(); i++) {
      stats[i] = 0;
      const correctOption = i < this.multi!.correct.length;
      const chosen = choice.multi!.includes(i);
      if (correctOption && chosen) {
        score += 1 / this.multi!.correct.length;
        stats[i] = 1;
      } else if (!correctOption && chosen) {
        stats[i] = 1;
        score -= 0.5;
      }
    }
    return { score: score > 0 ? score : 0, stats };
  }
}

export class OptionsMulti {
  correct: string[];
  wrong: string[];

  constructor(cm: JSONOptionMulti) {
    this.correct = cm.correct!;
    this.wrong = cm.wrong!;
  }

  total(): number {
    return this.correct.length + this.wrong.length;
  }

  fields(): string[]{
    return this.correct.concat(this.wrong);
  }

  field(f: number): string {
    if (f < this.correct.length){
      return this.correct[f];
    }
    if (f < this.total()){
      return this.wrong[f-this.correct.length];
    }
    throw new Error("Not so many fields");
  }

  toJson(): JSONOptionMulti {
    return {
      correct: this.correct,
      wrong: this.wrong,
    };
  }
}

interface ReplaceRegexp {
  find: RegExp,
  replace: string,
  flags?: string,
}

export class OptionRegexp {
  replace: ReplaceRegexp[];
  match: RegExp[];

  constructor(cr: JSONOptionRegexp) {
    this.replace = cr.replace!.map((r) => {
      const match = r.match(/^s\/(.*)\/(.*)\/(.*)$/);
      if (!match) {
        throw new Error("Invalid search and replace format");
      }
      const flags = match.length > 3 ? match[3] : '';
      return { find: new RegExp(match[1], flags), replace: match[2] };
    });
    this.match = cr.match!.map((m) => {
      const match = m.match(/^\/?(.*)\/(.*)\/?/);
      if (!match) {
        throw new Error("Invalid match regexp");
      }
      return new RegExp(match[1], match.length > 2 ? match[2] : '');
    });
  }

  applyReplace(s: string): string {
    for (const r of this.replace) {
      s = s.replace(r.find, r.replace);
    }
    return s;
  }

  isCorrect(s: string): boolean {
    return this.matches(s) >= 0;
  }

  matches(s: string): number {
    const search = this.applyReplace(s);
    for (let m = 0; m < this.match.length; m++) {
      if (search.search(this.match[m]) >= 0) {
        return m;
      }
    }
    return -1;
  }

  toJson(): JSONOptionRegexp {
    return {
      replace: this.replace.map((r) => `s${r.find}${r.replace}/${r.flags ?? ''}`),
      match: this.match.map((m) => m.toString()),
    };
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
        };
      case CourseStateEnum.Corrections:
        return {
          Corrections: this.dojoId?.toHex(),
        };
      case CourseStateEnum.Quiz:
        return {
          Quiz: this.dojoId?.toHex(),
        };
    }
  }
}

export class Dojo extends Nomad {
  quizId: QuizID = new QuizID();
  attempts: Map<string, DojoAttemptID> = new Map();
  private bs = new ReplaySubject<Dojo>(1);

  override update() {
    const d: JSONDojo = JSON.parse(this.json);
    this.quizId = QuizID.fromHex(d.quizId!);
    this.attempts = new Map(Object.entries(d.results!)
      .map(([user, result]) => [user, DojoAttemptID.fromHex(result)]));
    this.bs.next(this);
  }

  override toJson(): string {
    const results: { [key: string]: string; } = {};
    for (const [key, value] of this.attempts.entries()) {
      results[key] = value.toHex();
    }

    return JSON.stringify({
      quizId: this.quizId.toHex(),
      results,
    });
  }

  subscribe(observer: ((value: Dojo) => void)): Subscription {
    return this.bs.subscribe(observer);
  }

  async getAttempts(storage: StorageService): Promise<DojoAttempt[]> {
    return await storage.getNomads([...this.attempts.values()],
      (id: NomadID) => { return new DojoAttempt(id) });
  }

  async getUsers(storage: StorageService): Promise<User[]> {
    return storage.getNomads([...this.attempts.keys()].map((ids) => NomadID.fromHex(ids)),
      (id: NomadID) => { return new User(id) });
  }
}

export class DojoAttempt extends Nomad {
  dojoId: DojoID = new DojoID();
  choices: DojoChoice[] = [];

  override update() {
    const dr: JSONDojoAttempt = JSON.parse(this.json);
    this.dojoId = QuizID.fromHex(dr.dojoId!);
    this.choices = dr.results?.map((r) => new DojoChoice(r)) ?? [];
  }

  override toJson(): string {
    return JSON.stringify({
      dojoId: this.dojoId.toHex(),
      results: this.choices.map((r) => r.toJson()),
    });
  }

  choicesFilled(questions: Question[]): DojoChoice[] {
    if (this.choices.length < questions.length) {
      for (let i = this.choices.length; i < questions.length; i++) {
        this.choices.push(new DojoChoice(questions[i].options.multi !== undefined ?
          { Multi: [] } : { Regexp: "" }));
      }
    }
    return this.choices;
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

  isAnswered(): boolean {
    return (this.regexp !== undefined && this.regexp! !== "") ||
      (this.multi != undefined && this.multi!.length > 0);
  }

  toJson(): JSONDojoChoice {
    if (this.multi !== undefined) {
      return {
        Multi: this.multi!
      };
    } else {
      return {
        Regexp: this.regexp!
      };
    }
  }
}
