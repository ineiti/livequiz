import { CommonModule } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  link: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, CommonModule],
  standalone: true,
  templateUrl: 'breadcrumb.component.html',
})
export class BreadcrumbComponent {
  constructor(public bcs: BreadcrumbService) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  path: Breadcrumb[] = [{ label: "LiveQuiz", link: '' }];

  push(label: string, l: string) {
    const link = `${this.path[this.path.length - 1].link}/${l}`;
    this.path.push({ link, label });
  }

  pop() {
    this.path.pop();
  }
}
