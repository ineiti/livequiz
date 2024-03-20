import { TestBed } from '@angular/core/testing';

import { Question, QuestionType, Questionnaire, QuestionnaireService } from './questionnaire.service';

// describe('QuestionnaireService', () => {
//   let service: QuestionnaireService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(QuestionnaireService);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });

function newQuestion(): Question {
  let q = new Question();
  q.maxChoices = 2;
  q.choices = ["one", "two", "three", "four"];
  q.original = [0, 1, 2, 3];
  return q;
}

describe('Question', () => {
  it('should translate to/from shuffled', () => {
    let q = newQuestion();
    q.shuffle();
    expect(q.original.length).toBe(q.choices.length);
    const orig = [true, false, false, false];
    const qThis = q.origToShuffled(orig);
    const one = q.choices.find((_, i) => qThis[i]);
    expect(one).toBeDefined();
    expect(one).toBe("one");

    const origConv = q.shuffledToOrig(qThis);
    expect(origConv).toEqual([true, false, false, false]);
  });

  it('should calculate the correct results', () => {
    let q = newQuestion();
    q.shuffle();

    expect(q.resultOrig([true, true, false, false])).toBe("correct");
    expect(q.resultOrig([false, true, false, false])).toBe("answered");
  });

  it('calculates the score correctly', () => {
    let q = newQuestion();
    expect(q.score([0, 1])).toBe(1);
    expect(q.score([0])).toBe(0.5);
    expect(q.score([0, 2])).toBe(0);
    expect(q.score([2])).toBe(-0.5);
    expect(q.score([2, 3])).toBe(-1);
  });

  it('gets regexp question', () => {
    const q = new Questionnaire(`# Test
## Regexp
Question
~ s/ *//
- /(a|b)v/
- (c|b)n
## End`);
    expect(q.questions.length).toBe(1);
    expect(q.questions[0].qType).toBe(QuestionType.Regexp);
    expect(q.questions[0].replace).toEqual([" *", ""]);
    expect(q.questions[0].choices.length).toBe(2);
    expect(q.questions[0].choices[0]).toEqual("(a|b)v");
    expect(q.questions[0].choices[1]).toEqual("(c|b)n");
    expect(q.questions[0].resultRegexp("av")).toBe("correct");
    expect(q.questions[0].resultRegexp("bn")).toBe("correct");
    expect(q.questions[0].resultRegexp("aa")).toBe("answered");
    expect(q.questions[0].resultRegexp("")).toBe("empty");
  });
})