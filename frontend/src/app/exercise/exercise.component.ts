import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Answer } from '../services/answer.service';
import { Question } from '../services/questionnaire.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-exercise',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatProgressBarModule, MatListModule, MatGridListModule],
  templateUrl: './exercise.component.html',
  styleUrl: './exercise.component.scss'
})
export class ExerciseComponent {
  @Input() answer = new Answer(new Question(), []);
  @Input() showResults = false;
  @Output() selectionChange = new EventEmitter<MatSelectionList>();
  resultClasses: string[] = [];
  
  ngOnChanges() {
    for (let question = 0; question < this.answer.choices.length; question++) {
      this.resultClasses[question] = "question " +
        (this.showResults ?
          (this.answer.selected[question] ? "questionSelectionWrong" : "") : "");
    }
    if (this.showResults) {
      for (let correct = 0; correct < this.answer.maxChoices; correct++) {
        this.resultClasses[this.answer.correct[correct]] = "questionSelectionCorrect question";
      }
    }
  }

  updateSelection(event: MatSelectionList) {
    this.selectionChange.emit(event);
  }
}
