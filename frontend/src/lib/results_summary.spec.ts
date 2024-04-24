import { ResultsSummary, ResultsSummaryContainer } from "./results_summary";
import { DojoAttempt, DojoChoice, Question, Quiz } from "./structs";
import { NewQuestion } from "./structs_spec";

describe('ResultsSummaryContainer', () => {
    const quiz = new Quiz();
    const q1 = NewQuestion.createMulti('t1', 'i1', 'e1', ['o11', 'o12'], ['w11', 'w12']);
    const q2 = NewQuestion.createRegexp('t2', 'i2', 'e2', ['s/ //'], ['/2/']);
    quiz.questions.push(q1, q2);
    const rsc = new ResultsSummaryContainer();
    const attempt1 = new DojoAttempt();

    beforeEach(() => {
        attempt1.choices = [];
    })

    it('updates with empty attempt', () => {
        rsc.updateAttempts(quiz, [attempt1]);
    })

    it('updates answered', () => {
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.answered).toEqual([[false, false]]);

        attempt1.choices[0].multi = [1];
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.answered).toEqual([[true, false]]);

        attempt1.choices[1].regexp = "1";
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.answered).toEqual([[true, true]]);
    })

    it('updates scores', () => {
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0, 0]);

        attempt1.choices[0].multi = [2];
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0, 0]);

        attempt1.choices[0].multi = [1];
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0.5, 0]);

        attempt1.choices[0].multi = [0, 1];
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([1, 0]);

        attempt1.choices[0].multi = [0, 1, 2];
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0.5, 0]);

        attempt1.choices[1].regexp = "1";
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0.5, 0]);

        attempt1.choices[1].regexp = "2";
        rsc.updateAttempts(quiz, [attempt1]);
        expect(rsc.scores[0]).toEqual([0.5, 1]);
    })
})