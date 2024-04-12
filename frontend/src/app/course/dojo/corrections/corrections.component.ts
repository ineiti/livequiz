import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { GRID_MAX_WIDTH } from '../../../app.config';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-corrections',
  standalone: true,
  imports: [CommonModule, MatListModule, MatGridListModule, RouterLink],
  templateUrl: './corrections.component.html',
  styleUrl: './corrections.component.scss'
})
export class CorrectionsComponent {
  tileClasses: string[] = [];
  sResults?: Subscription;
  sNewResults?: Subscription;
  resultClasses = ['resultCorrect', 'resultCorrect', 'resultWrong', 'resultWrong'];
  resultWidth = ["100%", "50%", "50%", "80%"];

  constructor() {
  }

  async ngOnInit() {
    // await this.connection.setEditAllowed(this.user.secret, false);
    // await this.connection.setShowAnswers(this.user.secret, true);
    // this.sNewResults = this.results.newResults.subscribe(() => {
    //   this.updateResults();
    // });
    // this.sResults = this.results.answer.subscribe((a) => {
    //   this.result = a;
    //   this.updateResults();
    //   this.update();
    // });
  }

  async ngOnDestroy() {
    if (this.sNewResults !== undefined) {
      this.sNewResults!.unsubscribe();
    }
    if (this.sResults !== undefined) {
      this.sResults!.unsubscribe();
    }
  }

  updateResults() {
    // if (this.results.results.length < this.results.questionnaire.questions.length) {
    //   return;
    // }
    // for (let question = 0; question < this.results.questionnaire.questions.length; question++) {
    //   const score = Math.round(this.results.results[question].score * 4) + 4;
    //   this.tileClasses[question] = "questionTile" +
    //     (this.results.currentQuestion === question ? " questionTileChosen" : "") +
    //     (question % 2 === 1 ? " questionTileOdd" : "") +
    //     ` questionTileColor${score}`;
    // }
  }

  update() {
    // this.resultClasses = this.result.choices
    //   .map((_, i) => i < this.result.maxChoices ? 'resultCorrect' : 'resultWrong');
    // this.resultWidth = this.result.choices
    //   .map((s) => `${Math.round(s.stats * 10) * 5 + 50}%`)
  }

  gridWidth(a: number): number {
    if (a < GRID_MAX_WIDTH) {
      return a;
    }
    return Math.min(GRID_MAX_WIDTH, Math.ceil(a / (Math.ceil(a / GRID_MAX_WIDTH))) | 1)
  }

  clearSelection(e: MatSelectionListChange) {
    for (let i = 0; i < e.source.options.length; i++) {
      e.source.options.get(i)!.selected = this.isSelected(i);
    }
  }

  isSelected(index: number): boolean {
    // return index < this.result.maxChoices;
    return false;
  }
}
