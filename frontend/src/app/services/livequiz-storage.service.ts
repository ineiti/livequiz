import { Injectable } from '@angular/core';
import { Blob, BlobID, StorageService } from './storage.service';
import { Course } from '../../lib/structs';

@Injectable({
  providedIn: 'root'
})
export class LivequizStorageService {
  courses = new Courses();

  constructor(private storage: StorageService) {
    this.storage.addBlob(this.courses);
  }
}

class Courses extends Blob {
  list: Map<string, Course> = new Map();

  constructor() {
    super();
    this.id = BlobID.fromGlobalID("re.fledg.livequiz.courses");
  }

  override toJson(): string {
    return JSON.stringify({ list: [...this.list] });
  }

  override update() {
    const content = JSON.parse(this.json);
    this.updateMap(this.list, content.list);
  }
}