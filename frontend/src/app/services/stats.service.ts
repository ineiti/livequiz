import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { Stats, StatsEntries } from '../../lib/structs';
import { NomadID } from '../../lib/ids';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  stats!: Stats;
  entries!: StatsEntries;
  days = -1;

  static page_loaded = "page::loaded";
  static user_create = "user::create";
  static user_rename = "user::rename";
  static user_error = "user::error";
  static course_create = "course::create";
  static course_join = "course::join";
  static dojo_start = "dojo::start";
  static dojo_stop = "dojo::stop";
  static dojo_join = "dojo::join";
  static dojo_correction = "dojo::correction";
  static kata_start = "kata::start";
  static quiz_create_upload = "quiz::create::upload";
  static quiz_create_editor = "quiz::create";
  static quiz_edit = "quiz::edit";
  static quiz_update = "quiz::update";
  static quiz_delete = "quiz::delete";

  constructor(private storage: StorageService, private user: UserService) {
    this.createStats();
  }

  createStats() {
    const today = Math.floor(Date.now() / 1000 / 24 / 60 / 60);
    if (this.days === today) {
      return;
    }
    this.days = today;
    this.stats = new Stats(NomadID.fromGlobalID(`LivequizStats${today}`));
    const key = NomadID.fromGlobalID(`${this.user.id.toHex()}${today}`);
    this.stats.operations.set(key.toHex(), key)
    this.storage.addNomads(this.stats);
    this.entries = new StatsEntries(key);
    this.storage.addNomads(this.entries);
  }

  add(action: string) {
    this.createStats();
    this.entries.add(action);
  }
}
