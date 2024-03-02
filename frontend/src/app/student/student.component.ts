import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Questions, question } from '../../lib/questions';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';

const GRID_MAX_WIDTH = 13;

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule, MatGridListModule],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss'
})
export class StudentComponent {
  questions = new Questions("");
  currentQuestion = 0;
  name = "startup";
  showHints = true;

  constructor() {
  }

  async ngOnInit() {
    const response = await fetch("./assets/questions.md");
    const text = await response.text();
    this.questions = new Questions(text);
  }

  updateSelection(event: MatSelectionList) {
    this.questions.updateSelection(event);
  }

  tileClass(index: number): string {
    return "questionTile" + (this.questions.currentQuestion === index ? " questionTileChosen" : "") +
    (index % 2 === 1 ? " questionTileOdd" : "") +
    (this.questions.done[index] ? " questionTileDone" : "");
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH){
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }
}
