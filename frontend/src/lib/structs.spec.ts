import { NomadID } from "./ids";
import { ResultsSummaryContainer } from "./results_summary";
import { DojoAttempt, OptionRegexp, OptionsMulti, Question, Quiz, Stats } from "./structs";
import { readFileSync } from 'fs';

describe('Structs', () => {
    it('OptionRegexp filters and matches correctly', async () => {
        const or = new OptionRegexp({
            replace: ["s/ //g", "s/;/e/"],
            match: ["/^one$/i", "/^two$/", "three"]
        });
        expect(or.replace.length).toBe(2);
        expect(or.replace[0]).toEqual({ find: new RegExp(/ /g), replace: '' });
        expect(or.replace[1]).toEqual({ find: new RegExp(/;/), replace: 'e' });
        expect(or.match.length).toBe(3);
        expect(or.match[0]).toEqual(new RegExp(/^one$/i));
        expect(or.match[1]).toEqual(new RegExp(/^two$/));
        expect(or.match[2]).toEqual(new RegExp(/three/));
        expect(or.isCorrect("one")).toBeTrue();
        expect(or.isCorrect("One")).toBeTrue();
        expect(or.isCorrect(" one ")).toBeTrue();
        expect(or.isCorrect("on;")).toBeTrue();
        expect(or.isCorrect("two")).toBeTrue();
        expect(or.isCorrect("Two")).toBeFalse();
        expect(or.isCorrect("three")).toBeTrue();
        expect(or.isCorrect("thr;;")).toBeFalse();
    });

    it('OptionRegexp gets cloned correctly', async () => {
        const or = new OptionRegexp({
            replace: ["s/ //g", "s/;/e/"],
            match: ["/^one$/i", "/^two$/", "three"]
        });
        const or2 = new OptionRegexp(or.toJson());
        expect(or).toEqual(or2);
    });
});

describe('Quiz', () => {
    it('gets regexp question', () => {
        const q = Quiz.fromStr(`# Test
## Regexp
Question
~ s/ *//
~ s/. +//g
- /(a|b)v/
- /(c|b)n/i
- /(c|b)n/i
## End`);
        expect(q.questions.length).toBe(1);
        expect(q.questions[0].options.regexp).not.toBe(undefined);
        const reg = q.questions[0].options.regexp;
        expect(reg?.replace.length).toBe(2);
        expect(reg?.match.length).toBe(3);
        expect(reg?.replace[0]).toEqual({ find: new RegExp(/ */), replace: "" });
        expect(reg?.replace[1]).toEqual({ find: new RegExp(/. +/g), replace: "" });
        expect(reg?.match[0]).toEqual(new RegExp(/(a|b)v/));
        expect(reg?.match[1]).toEqual(new RegExp(/(c|b)n/i));
        expect(reg?.match[2]).toEqual(new RegExp(/(c|b)n/i));
        expect(q.questions[0].options.regexp!.matches("av")).toBe(0);
        expect(q.questions[0].options.regexp!.matches("aV")).toBe(-1);
        expect(q.questions[0].options.regexp!.matches("cbn")).toBe(1);
        expect(q.questions[0].options.regexp!.matches("cBn")).toBe(1);
    });

    it('gets multi question', () => {
        const q = Quiz.fromStr(`# Test
## Multi
Question
= 2
- one
- two
- three
some more comments
## End`);
        expect(q.questions.length).toBe(1);
        expect(q.questions[0].options.multi).not.toBe(undefined);
        const multi = q.questions[0].options.multi!;
        expect(multi.total()).toBe(3);
        expect(multi.correct.length).toBe(2);
        expect(multi.wrong.length).toBe(1);
        expect(q.title).toBe("Test");
        expect(q.questions[0].title).toBe("Multi");
        expect(q.questions[0].intro).toBe("Question ");
        expect(q.questions[0].explanation).toBe("some more comments ");
    });

    it('gets two questions', () => {
        const q = Quiz.fromStr(`# Test
## Multi
Question
= 1
- one
- three
some more comments
## Regexp
Question 2
~ s/.*//
- //
extro
## End`);
        expect(q.questions.length).toBe(2);
        expect(q.questions[0].options.multi).not.toBe(undefined);
        expect(q.questions[1].options.regexp).not.toBe(undefined);
    });

    it('doesn\'t lose last comment', () => {
        const q = Quiz.fromStr(quiz1);
        const qText = q.toText();
        expect(qText.trim()).toBe(quiz1);
    })

    it('calculates the scores', () => {
        const q = Quiz.fromStr(readFileSync(`${__dirname}/../selenium/quiz2.md`).toString());
        const attempts: DojoAttempt[] = JSON.parse(readFileSync(`${__dirname}/../selenium/quiz2.answers.json`).toString())
            .map((a: any) => new DojoAttempt(new NomadID(), 1, JSON.stringify(a)));
        attempts.forEach((a) => a.update());
        const results = new ResultsSummaryContainer();
        results.updateAttempts(q, attempts);
        const scores = q.sortScores(attempts);
        for (let entry = 0; entry < q.questions.length; entry++){
            const question = scores[entry][0];
            console.log(`Question ${question + 1} - ${q.questions[question].summary()}`);
            console.log(results.chosen[question], Math.round(scores[entry][1] * 100)/100);
        }
    })
});

describe("(de)serialization", () => {
    it("for Stats", () => {
        const json_s = JSON.stringify({ "operations": { "1234": [{ "time": 0, action: "user::create" }] } });
        const s = new Stats();
        s.json = json_s;
        s.update();
        expect(s.toJson()).toBe(json_s);
    })
});

const quiz1 = `# Test
## Multi

Question

= 1
- one
- three

some more comments`;