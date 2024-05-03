import { Subscription } from "rxjs";
import { LivequizStorageService } from "../app/services/livequiz-storage.service";
import { StorageService } from "../app/services/storage.service";
import { DojoID, NomadID, UserID } from "./ids";
import { Dojo, DojoAttempt, DojoChoice, Quiz } from "./structs";
import { User } from "../app/services/user.service";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { Question } from "./structs";
import { sha256 } from "js-sha256";

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

export class Answer {
  maxChoices: number = 1;
  options: string[] = [];
  original: number[] = [];
  selected: boolean[] = [];

  constructor(public question: Question, public choice: DojoChoice, user: UserID) {
    if (question.options.multi !== undefined) {
      this.maxChoices = question.options.multi!.correct.length +
        question.options.multi!.wrong.length;
    }

    if (!this.isRegexp()) {
      this.options = question.options.multi!.correct.concat(question.options.multi!.wrong);
      this.original = this.options.map((_, i) => i);
      this.selected = this.options.map((_, i) => choice.multi!.includes(i));
      this.shuffle(user);
    }
  }

  // Shuffle the answers, seeding using the question and the userID.
  // This allows to have an individual but constant shuffling of each question for one user,
  // but different for each user.
  shuffle(user: UserID) {
    const multiplier = 1103515245;
    const increment = 12345;
    const modulus = Math.pow(2, 31);
    const hash = sha256.create();
    hash.update(user.data);
    hash.update(JSON.stringify(this.question.toJson()));
    let seed = hash.digest()[0];

    for (let i = this.options.length - 1; i > 0; i--) {
      seed = (multiplier * seed + increment) % modulus;
      const j = Math.floor(seed / (modulus / (i + 1)));
      for (const arr of [this.options, this.original, this.selected]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
  }

  // Returns whether the given option would be correct (for multiple choice),
  // or if the entered regexp is correct. 
  correctAnswer(option: number): boolean {
    if (this.question.options.regexp !== undefined) {
      return this.question.options.regexp!.isCorrect(this.choice.regexp!);
    } else {
      return this.original[option] < this.question.options.multi!.correct.length;
    }
  }

  isCorrectMulti(option: number): boolean {
    return this.original[option] < this.question.options.multi!.correct.length;
  }

  // Either it chosen by the user, or it must be chosen by them.
  needsCorrection(option: number): boolean {
    return this.selected[option] || this.isRegexp() || this.isCorrectMulti(option);
  }

  isRegexp(): boolean {
    return this.question.options.regexp !== undefined;
  }

  isMulti(): boolean {
    return !this.isRegexp() && this.question.options.multi!.correct.length > 1;
  }

  isSingle(): boolean {
    return !this.isRegexp() && this.question.options.multi!.correct.length === 1;
  }

  // TODO: make something nicer with the MatListOption here...
  // updateSelection(selected: MatListOption[] | { value: number }[]) {
  updateSelection(selected: any[] | { value: number; }[]) {
    this.choice.multi = selected.map((s) => this.original[s.value]);
  }
}
