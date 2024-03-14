import { TestBed } from '@angular/core/testing';

import { Question, QuestionnaireService } from './questionnaire.service';

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

    expect(q.resultShuffled(q.origToShuffled([true, false, false, false]))).toBe("correct");
    expect(q.resultShuffled(q.origToShuffled([false, true, false, false]))).toBe("answered");
  });

  it('calculates the score correctly', () => {
    let q = newQuestion();
    expect(q.score([0, 1])).toBe(1);
    expect(q.score([0])).toBe(0.5);
    expect(q.score([0, 2])).toBe(0);
    expect(q.score([2])).toBe(-0.5);
    expect(q.score([2, 3])).toBe(-1);
  })
})