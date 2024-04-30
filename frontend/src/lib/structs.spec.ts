import { OptionRegexp, OptionsMulti, Question, Quiz } from "./structs";

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

describe('Question', () => {
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
})