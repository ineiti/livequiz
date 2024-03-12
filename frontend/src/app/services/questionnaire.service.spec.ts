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

describe('Question', () => {
  it('should translate to/from shuffled', () => {
    let q = new Question();
    q.maxChoices = 2;
    q.choices = ["one", "two", "three", "four"];
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
    let q = new Question();
    q.maxChoices = 1;
    q.choices = ["one", "two", "three", "four"];
    q.shuffle();

    expect(q.result(q.origToShuffled([true, false, false, false]))).toBe("correct");
    expect(q.result(q.origToShuffled([false, true, false, false]))).toBe("answered");
  })
})