import { Injectable } from '@angular/core';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Secret } from '../../lib/ids';
import { Nomad } from "../../lib/storage";
import { NomadID, H256 } from "../../lib/ids";

export class User extends Nomad {
  name = "undefined";

  override update() {
    const json = JSON.parse(this.json);
    this.name = json.name;
  }

  override toJson(): string {
    return JSON.stringify({ name: this.name });
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends User {
  secret: Secret;

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
      this.secret = new Secret();
      this.json = this.toJson();
      this.update();
    } else {
      const json = JSON.parse(jsonStr);
      this.name = json.name;
      this.secret = Secret.from_hex(json.secret);
      this.id = NomadID.fromHex(this.secret.hash().toHex());
    }
  }

  override update() {
    const json = JSON.parse(this.json);
    this.name = json.name;

    localStorage.setItem('user-json', JSON.stringify({
      name: this.name,
      secret: this.secret.toHex(),
    }));
  }
}
