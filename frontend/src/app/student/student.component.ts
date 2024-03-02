import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Questions, question } from '../../lib/questions';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule, MatSelectionList } from '@angular/material/list';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatListModule],
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
}
