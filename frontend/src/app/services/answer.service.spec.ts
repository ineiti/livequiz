import { Question } from "./questionnaire.service";

describe('Answer', () => {
    it('should return correct answers', () => {
        let q = new Question();
        q.maxChoices = 2;
        q.choices = ["one", "two", "three", "four"];
        q.original = [0, 1, 2, 3];
        q.shuffle();
        let correct = q.correct().map((c) => q.choices[c]);
        correct.sort();
        expect(correct).toEqual(["one", "two"]);
    })
});
