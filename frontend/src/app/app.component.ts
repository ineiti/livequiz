import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserService } from './services/user.service';
import { StorageService } from './services/storage.service';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { StatsService } from './services/stats.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule, MatInputModule, MatButtonModule, BreadcrumbComponent,
    CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'livequiz';
  userLoaded = false;

  constructor(public user: UserService, private storage: StorageService,
    private stats: StatsService) { }

  async ngOnInit() {
    return new Promise((resolve) => this.user.loaded.subscribe(async (_) => {
      this.storage.addNomads(this.user);
      await this.storage.updateLoop();
      this.userLoaded = true;
      this.stats.add(StatsService.page_loaded);
      if (this.user.error) {
        this.stats.add(StatsService.user_error);
      }
      if (this.user.create) {
        this.stats.add(StatsService.user_create);
      }
      resolve(false);
    }));
  }

  print_stats(): string {
    const log = this.stats.entries.entries.map((entry) => `${entry.time}: ${entry.action}`);
    return log.reverse().join("\n");
  }

  userRename() {
    this.stats.add(StatsService.user_rename);
  }
}
