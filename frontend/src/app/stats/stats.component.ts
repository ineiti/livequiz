import { Component } from '@angular/core';
import { EChartsOption } from 'echarts';
import { StatsService } from '../services/stats.service';
import { StorageService } from '../services/storage.service';
import { Stats, StatsEntries } from '../../lib/structs';
import { NomadID } from '../../lib/ids';
import { BreadcrumbService } from '../components/breadcrumb/breadcrumb.component';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

type LabelNames = ('All' | 'User' | 'Course' | 'Dojo' | 'Quiz');

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  providers: [
    provideEcharts(),
  ]
})
export class StatsComponent {
  statsDays: Stats[] = [];
  statsEntries: StatsEntries[] = [];
  statsChoiceLabels = {
    'All': ["Stats", "Visitors", "PageLoad", "User", "Course", "Dojo", "Quiz"],
    'User': ["Stats", "Create", "Rename", "Error"],
    'Course': ["Stats", "Create", "Join"],
    'Dojo': ["Stats", "Start", "Stop", "Join", "Correction", "Kata"],
    'Quiz': ["Stats", "CreateUpload", "CreateEditor", "Edit", "Update", "Delete"]
  };
  statsChoiceActions = {
    'All': ["visitors", StatsService.page_loaded, "user::", "course::", "dojo::", "quiz::"],
    'User': [StatsService.user_create, StatsService.user_rename, StatsService.user_error],
    'Course': [StatsService.course_create, StatsService.user_create],
    'Dojo': [StatsService.dojo_start, StatsService.dojo_stop, StatsService.dojo_join, StatsService.dojo_correction, StatsService.kata_start],
    'Quiz': [StatsService.quiz_create_upload, StatsService.quiz_create_editor, StatsService.quiz_edit, StatsService.quiz_update, StatsService.quiz_delete]
  }

  static toValue(v: number): string {
    return `${v === 0 ? '0' : Math.round(Math.pow(2, v - 1))}`;
  }

  options: EChartsOption = {
    legend: {},
    tooltip: {
      valueFormatter: (v) => StatsComponent.toValue(v as number),
    },
    xAxis: { type: 'category' },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => StatsComponent.toValue(value),
      },
      minInterval: 1,
    },
    label: {
      formatter: (value: any) => `${value}something`
    }
  };

  updateOptions: EChartsOption[] = [];

  constructor(private stats: StatsService, private storage: StorageService,
    private bcs: BreadcrumbService) { }

  async ngOnInit() {
    this.bcs.push("Stats", 'stats');
    this.updateStats();
  }

  async ngOnDestroy() {
    this.bcs.pop();
  }

  async updateStats() {
    const statsIDs: NomadID[] = [];
    const width = 7;
    for (let past = -width; past <= 0; past++) {
      statsIDs.push(StatsService.getStatsID(this.stats.today + past));
    }
    this.statsDays = await this.storage.getNomads(statsIDs, (id) => new Stats(id));

    const statsEntriesIDs = this.statsDays.flatMap((s) => [...s.operations.values()]);
    this.statsEntries = await this.storage.getNomads(statsEntriesIDs, (id) => new StatsEntries(id));
    this.updateOptions = [];
    for (const name of ['All', 'User', 'Course', 'Dojo', 'Quiz']) {
      await this.addStats(width, name as LabelNames);
    }

    // await new Promise((resolve) => setTimeout(resolve, 500));
    await this.storage.clearNomads(...this.statsDays.filter((s) => !s.id.equals(this.stats.stats.id)));
    await this.storage.clearNomads(...this.statsEntries.filter((s) => !s.id.equals(this.stats.entries.id)));
  }

  async addStats(width: number, name: LabelNames) {
    const source: (string | number)[][] = [this.statsChoiceLabels[name]];
    const dayMSec = 86400 * 1000;
    let date = new Date((this.stats.today - width) * dayMSec);
    for (const stat of this.statsDays) {
      const dateStr = date.toISOString().slice(5, 10);
      const visitors = stat.operations.size;
      const statsLine: (string | number)[] = [dateStr];
      if (visitors > 0) {
        const ses = new CountActions(stat, this.statsEntries);
        statsLine.push(...this.statsChoiceActions[name]
          .map((s) => ses.action(s)));
      }
      source.push(statsLine);
      date = new Date(date.getTime() + dayMSec);
    }
    this.updateOptions.push({
      dataset: [
        {
          source: source.map((line, i) => line.map((e, j) => (i * j === 0) ? e : (e === 0 ? 0 : Math.log2(e as number) + 1))),
        },
      ],
      series: source[0].slice(1).map((_) => { return { type: 'bar' } }),
    });
  }
}

class CountActions {
  ses: StatsEntries[] = [];

  constructor(stat: Stats, entries: StatsEntries[]) {
    this.ses = [...stat.operations.values()]
      .map((v) => entries.find((se) => se.id.equals(v)))
      .filter((se) => se !== undefined) as StatsEntries[];
  }

  action(name: string): number {
    if (name === "visitors") {
      return this.ses.length;
    }
    return this.ses
      .map((se) => se!.entries.filter((e) => e.action.startsWith(name)).length)
      .reduce((prev, curr) => prev + curr);
  }
}