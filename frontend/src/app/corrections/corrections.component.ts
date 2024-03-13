import { Component } from '@angular/core';
import { ConnectionService } from '../services/connection.service';
import { Question, QuestionnaireService } from '../services/questionnaire.service';
import { UserService } from '../services/user.service';
import { Answer, AnswerService } from '../services/answer.service';
import { CommonModule } from '@angular/common';
import { ExerciseComponent } from '../exercise/exercise.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { GRID_MAX_WIDTH } from '../app.config';

@Component({
  selector: 'app-corrections',
  standalone: true,
  imports: [CommonModule, ExerciseComponent, MatListModule, MatGridListModule],
  templateUrl: './corrections.component.html',
  styleUrl: './corrections.component.scss'
})
export class CorrectionsComponent {
  tileClasses: string[] = [];
  answer = new Answer(new Question(), [])

  constructor(private connection: ConnectionService, private qservice: QuestionnaireService,
    public answers: AnswerService, private user: UserService) {
  }

  async ngOnInit() {
    await this.connection.setEditAllowed(this.user.secret, false);
    await this.connection.setShowAnswers(this.user.secret, true);
  }

  next() { }
  previous() { }
  goto(q: number) { }
  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }
}
