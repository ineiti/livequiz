import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  secret = Buffer.alloc(32);
  name = "undefined";

  constructor(private connection: ConnectionService) {
    this.init();
  }

  async init() {
    const user_secret = localStorage.getItem('user-secret');
    if (user_secret === null) {
      self.crypto.getRandomValues(this.secret);
      localStorage.setItem('user-secret', this.secret.toString('hex'));
    } else {
      this.secret = Buffer.from(user_secret, 'hex');
    }

    const name = localStorage.getItem('user-name');
    if (name === null) {
      this.name = uniqueNamesGenerator({
        dictionaries: [colors, animals],
        separator: '-',
      });
    } else {
      this.name = name;
    }
    this.updateName();
  }

  async updateName() {
    localStorage.setItem('user-name', this.name);
    this.connection.updateName(this.secret, this.name);
  }

  secretHex(): string{
    return this.secret.toString('hex');
  }
}
