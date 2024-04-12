import { Injectable } from '@angular/core';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Secret } from '../../lib/ids';
import { Nomad } from "../../lib/storage";
import { NomadID, H256 } from "../../lib/ids";

@Injectable({
  providedIn: 'root'
})
export class UserService extends Nomad {
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

  override toJson(): string {
    return JSON.stringify({ name: this.name });
  }

  isIn(other: H256[]): boolean {
    return this.secret.hash().isIn(other);
  }
}