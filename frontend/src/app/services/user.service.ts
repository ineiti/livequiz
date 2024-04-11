import { Injectable } from '@angular/core';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Secret } from '../../lib/ids';
import { Blob, BlobID, StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  secret = new Secret();
  name = "undefined";
  user = new User();

  constructor(storage: StorageService) {
    storage.addBlob(this.user);
  }
}

class User extends Blob {
  secret = new Secret();
  name = "undefined";

  constructor() {
    super();

    const jsonStr = localStorage.getItem('user-json');
    if (jsonStr === null) {
      const name = localStorage.getItem('user-name');
      if (name === null) {
        this.name = uniqueNamesGenerator({
          dictionaries: [colors, animals],
          separator: '-',
        });
      } else {
        this.name = name;
      }
    } else {
      const json = JSON.parse(jsonStr);
      this.name = json.name;
      this.secret = Secret.from_hex(json.secret);
      this.id = BlobID.from_hex(this.secret.hash().to_hex());
    }
  }

  override update() {
    const json = JSON.parse(this.json);
    this.name = json.name;
    localStorage.setItem('user-json', JSON.stringify({
      name: this.name,
      secret: this.secret.to_hex(),
    }));
  }

  override toJson(): string {
    return JSON.stringify({ name: this.name });
  }
}