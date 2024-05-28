import { ReplaySubject, Subscription } from "rxjs";
import { UserID, QuizID, DojoID, DojoAttemptID, NomadID, H256, StatsEntriesID } from "./ids";
import { JSONCourse, JSONQuiz, JSONQuestion, JSONChoice, JSONChoiceMulti as JSONOptionMulti, JSONChoiceRegexp as JSONOptionRegexp, JSONCourseState, JSONDojo, JSONDojoAttempt, JSONDojoChoice, JSONStats, JSONStatsEntry } from "./jsons";
import { Nomad } from "./storage";
import { User } from "../app/services/user.service";
import { StorageService } from "../app/services/storage.service";

export class Course extends Nomad {
  name: string = "";
  admins: UserID[] = [];
  quizIds: QuizID[] = [];
  state: CourseState = new CourseState({});
  dojoIds: DojoID[] = [];

  override update() {
    const json: JSONCourse = JSON.parse(this.json);
    this.name = json.name!;
    this.admins = json.admins?.map((a) => UserID.fromHex(a)) ?? [];
    this.quizIds = json.quizIds?.map((q) => QuizID.fromHex(q)) ?? [];
    this.state = new CourseState(json.state ?? { Idle: {} });
    this.dojoIds = json.dojoIds?.map((r) => DojoID.fromHex(r)) ?? [];
  }

  override toJson(): string {
    return JSON.stringify({
      name: this.name,
      admins: this.admins.map((a) => a.toHex()),
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

  toText(): string {
    return `# ${this.title}\n` +
      this.questions.map((q) => q.toText() + "\n").join("\n");
  }

  sortScores(attempts: DojoAttempt[]) {
    const sorted: [number, number][] = [];
    for (let question = 0; question < this.questions.length; question++) {
      const attemptsAnswered = attempts
        .filter((attempt) => attempt.choicesFilled(this.questions)[question].isAnswered());
      if (attemptsAnswered.length > 0) {
        const sum = attemptsAnswered
          .map<number>((attempt) =>
            this.questions[question].options.scoreStats(attempt.choices[question]).score)
          .concat([1])
          .reduce((prev, curr) => prev + curr ** 2);
        sorted[question] = [question, sum / attempts.length];
      } else {
        sorted[question] = [question, 0]
      }
    }
    sorted.sort((a, b) => a[1] - b[1]);
    return sorted;
  }

  static fromStr(text: string): Quiz {
    const q = new Quiz();

    let current = new Question();
    let explanation = false;
    let maxChoices = 0;
    let reg: JSONOptionRegexp = { replace: [], match: [] };
    text += "\n## end"
    for (const line of text.split("\n")) {
      if (line.length === 0) {
        continue;
      }
      const linePre = line.replace(/`(.*?)`/g, "<span class='pre'>$1</span>");
      const interpret = linePre.match(/([#=~;-]*) *(.*)/);
      if (interpret?.length != 3) {
        console.error(`Cannot parse line ${line}`);
        continue;
      }
      const [_, tag, text] = interpret;
      switch (tag) {
        case '#':
          q.title = text;
          break;
        case '##':
          if (current.title !== "") {
            if (maxChoices !== 0) {
              if (maxChoices < 0) {
                current.options.regexp = new OptionRegexp(reg);
              }
              q.questions.push(current);
            }
            current = new Question();
            explanation = false;
            reg = { replace: [], match: [] };
          }
          maxChoices = 0;
          current.title = text;
          break;
        case '-':
          if (maxChoices > 0) {
            if (current.options.multi!.correct.length < maxChoices) {
              current.options.multi!.correct.push(text);
            } else {
              current.options.multi!.wrong.push(text);
            }
          } else {
            reg.match?.push(text);
          }
          explanation = true;
          break;
        case '~':
          maxChoices = -1;
          reg.replace?.push(text);
          break;
        case '=':
          maxChoices = parseInt(text);
          current.options.multi = new OptionsMulti();
          break;
        case ';':
          continue;
        default:
          if (explanation) {
            current.explanation += linePre + " ";
          } else {
            current.intro += linePre + " ";
          }
          break;
      }
    }

    return q;
  }
}

export class Question {
  title: string = "";
  intro: string = "";
  options: Options = new Options();
  explanation: string = "";

  constructor(q?: JSONQuestion) {
    if (q !== undefined) {
      this.title = q.title!;
      this.intro = q.intro!;
      this.options = new Options(q.options!);
      this.explanation = q.explanation!;
    }
  }

  toText(): string {
    return `## ${this.title}\n\n${this.intro}\n\n` + this.options.toText();
  }

  toJson(): JSONQuestion {
    return {
      title: this.title,
      intro: this.intro,
      options: this.options?.toJson(),
      explanation: this.explanation
    };
  }

  summary(): string {
    if (this.options.multi !== undefined) {
      return `Multi (${this.options.multi?.correct.length} / ${this.options.multi?.total()})`;
    } else {
      return `Regexp`;
    }
  }
}

export class Options {
  multi?: OptionsMulti;
  regexp?: OptionRegexp;

  constructor(c?: JSONChoice) {
    if (c !== undefined) {
      if (c.Multi !== undefined) {
        this.multi = new OptionsMulti(c.Multi!);
      } else {
        this.regexp = new OptionRegexp(c.Regexp!);
      }
    }
  }

  toText(): string {
    return this.multi !== undefined ? this.multi!.toText() : this.regexp!.toText();
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
      if (choice.regexp === undefined) {
        return { score: 0, stats: [] };
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
    return { score: Math.max(score, 0), stats };
  }
}

export class OptionsMulti {
  correct: string[] = [];
  wrong: string[] = [];

  constructor(cm?: JSONOptionMulti) {
    if (cm !== undefined) {
      this.correct = cm.correct!;
      this.wrong = cm.wrong!;
    }
  }

  toText(): string {
    return `= ${this.correct.length}\n${this.fields().map((f) => `- ${f}`).join("\n")}`;
  }

  total(): number {
    return this.correct.length + this.wrong.length;
  }

  fields(): string[] {
    return this.correct.concat(this.wrong);
  }

  field(f: number): string {
    if (f < this.correct.length) {
      return this.correct[f];
    }
    if (f < this.total()) {
      return this.wrong[f - this.correct.length];
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
}

export class OptionRegexp {
  replace: ReplaceRegexp[] = [];
  match: RegExp[] = [];

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
      const match = m.match(/(^\/(.*)\/(.*)|(.*))/);
      if (!match) {
        throw new Error(`Invalid match regexp: ${m}`);
      }
      if (match[4] !== undefined) {
        return new RegExp(match[4]);
      }
      return new RegExp(match[2], match[3] ?? '');
    });
  }

  toText(): string {
    return (this.replace.map((r) => `~ s/${r.find.source}/${r.replace}/${r.find.flags}`)
      .concat(this.match.map((m) => `- ${m}`))).join("\n");
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
      replace: this.replace.map((r) => `s/${r.find.source}/${r.replace}/${r.find.flags ?? ''}`),
      match: this.match.map((m) => m.toString()),
    };
  }
}

export enum CourseStateEnum {
  Idle,
  Dojo,
  Corrections
}

export class CourseState {
  state: CourseStateEnum;
  dojoId?: DojoID;

  constructor(cs: JSONCourseState) {
    if (cs.Dojo !== undefined) {
      this.state = CourseStateEnum.Dojo;
      this.dojoId = DojoID.fromHex(cs.Dojo!);
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
    return this.state === CourseStateEnum.Dojo;
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
      case CourseStateEnum.Dojo:
        return {
          Dojo: this.dojoId?.toHex(),
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
    const attempts = Object.entries(d.attempts!)
      .map<[string, DojoAttemptID]>(([user, result]) => [user, DojoAttemptID.fromHex(result)]);
    this.updateMap(this.attempts, attempts);
    this.bs.next(this);
  }

  override toJson(): string {
    const attempts = Object.fromEntries([...this.attempts.entries()]
      .map(([k, v]) => [k, v.toHex()]));

    return JSON.stringify({
      quizId: this.quizId.toHex(),
      attempts,
    });
  }

  subscribe(observer: ((value: Dojo) => void)): Subscription {
    return this.bs.subscribe(observer);
  }

  async getAttempts(storage: StorageService): Promise<DojoAttempt[]> {
    const attemptIds = [...this.attempts.values()];
    const attempts = await storage.getNomads(attemptIds,
      (id: NomadID) => { return new DojoAttempt(id) });
    return attempts;
  }

  async getUsers(storage: StorageService): Promise<User[]> {
    return storage.getNomads([...this.attempts.keys()].map((ids) => NomadID.fromHex(ids)),
      (id: NomadID) => { return new User(id) });
  }
}

export class DojoAttempt extends Nomad {
  choices: DojoChoice[] = [];

  override update() {
    const dr: JSONDojoAttempt = JSON.parse(this.json);
    this.choices = dr.choices?.map((r) => new DojoChoice(r)) ?? [];
  }

  override toJson(): string {
    return JSON.stringify({
      choices: this.choices.map((r) => r.toJson()),
    });
  }

  choicesFilled(questions: Question[]): DojoChoice[] {
    this.initChoices(questions);
    return this.choices;
  }

  initChoices(questions: Question[]) {
    if (this.choices.length < questions.length) {
      for (let i = this.choices.length; i < questions.length; i++) {
        this.choices.push(new DojoChoice(questions[i].options.multi !== undefined ?
          { Multi: [] } : { Regexp: "" }));
      }
    }
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

export class Stats extends Nomad {
  operations: Map<string, StatsEntriesID> = new Map();

  override update() {
    const d: JSONStats = JSON.parse(this.json);
    this.updateMap(this.operations, Object.entries(d.operations!)
      .map<[string, StatsEntriesID]>(([user, _]) => [user, StatsEntriesID.fromHex(user)]));
  }

  override toJson(): string {
    return JSON.stringify({
      operations: Object.fromEntries([...this.operations.entries()]
        .map(([id, _]) => [id, id]))
    });
  }
}

export class StatsEntries extends Nomad {
  entries: JSONStatsEntry[] = [];

  override update() {
    this.entries = JSON.parse(this.json);
  }

  override toJson(): string {
    return JSON.stringify(this.entries);
  }

  add(action: string) {
    this.entries.push({ time: Date.now(), action });
  }
}