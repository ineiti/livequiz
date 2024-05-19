import { BehaviorSubject, Subject } from "rxjs";
import { H256, NomadID, UserID } from "./ids";

// 1st the client sends the nomadIDs and the versions, plus any local updates.
// This supposes that conflicts are less common than successful updates.
// If it turns out that conflicts are more common, 
// this should only send whether the object has been changed locally.
export interface JSONNomadUpdateRequest {
  nomadVersions: { [key: string]: { version: number; json?: string; }; };
}

// 2nd the server replies with new nomad datas.
// This includes nomads for which the client sent an update, but which
// have changed in between on the server.
// If the client sent an update for an outdated nomad, the client must
// first update its nomad, then send it again.
// It is up to the client to decide what to do with conflicting fields
// (the ones which changed on the client and on the server).
export interface JSONNomadUpdateReply {
  nomadData: { [key: string]: JSONUpdateEntry; };
}

export interface JSONUpdateEntry {
  version: number;
  json: string;
  owners: string[];
  time_created: number;
  time_last_updated: number;
  time_last_read: number;
}

// Nomad is the base class to implement a simple client/server storage synchronization.
// In the current implementation, the storage service checks if it needs to send updated
// nomads to the server by calling `toJson` on all nomads.
// Then it sends the nomads to be updated, and a version-# of the other nomads to the server.
// The server replies with nomads for which it has a more up-to-date version.
// This is not very efficient, and the current access management using the `owners` field
// is not very flexible.
// Here some thoughts of how to do it better:
// TODO:
// - Use setters in the child classes, which also set a 'changed' flag to 'true'.
//  This allows the storage service to go through the nomads quicker.
// - Store access-rights related to fields, e.g., 'name::update', or
//  'students::push', and then only send the actions to the server. This allows
//  the server to verify the actions in a simple way and gives more fine-grained
//  access control. This could be implemented using a macro in rust, and then
//  use rust-to-wasm to implement the same in javascript.
// - Create an array of NomadID/version for the server, and then only add/remove from
//  those. So the client doesn't have to send all NomadID/version just to know if something
//  changed on the server.
export class Nomad {
  owners: UserID[] = [];
  time_created = Date.now();
  time_last_updated = Date.now();
  time_last_read = Date.now();
  updated = new Subject<string>();

  // The json field is used to detect changes in the object.
  // It must only be read by the object, never written to.
  constructor(public id = new NomadID(), public version = 0, public json = "") {
  }

  // The to_json must always return the same string, unless the object changed.
  toJson(): string {
    throw new Error("Method not implemented.");
  }

  // Update deserializes the json from the json-field and updates its fields.
  // It must take care about concurrent changes.
  // The simplest way is to ignore concurrent changes with values, but at least make
  // sure that maps get merged correctly: e.g., by only allowing appending to maps.
  // This can be done by making sure that this object maps get written back to the
  // map received from the server.
  update(): void {
    throw new Error("Method not implemented.");
  }

  // This updates the map by overriding with the new key/value pairs from the 
  // server. But it keeps existing key/value pairs.
  // This is a very simple merge algorithm.
  updateMap<K extends (string | number | symbol), V>(map: Map<K, V>, json: [K, V][] | undefined) {
    if (json === undefined) {
      return;
    }

    if (json.length > 0) {
      for (const [k, v] of json) {
        map.set(k, v);
      }
    }
  }

  // Returns a reply to send to the server
  getReply(): JSONUpdateEntry {
    return {
      version: this.version,
      json: this.toJson(),
      owners: this.owners.map((owner) => owner.toHex()),
      time_created: this.time_created,
      time_last_updated: this.time_last_updated,
      time_last_read: this.time_last_read,
    };
  }


  // Does a comparison using toHex, because the same H256 cannot be compared
  // with 'includes'.
  isIn(other: H256[]): boolean {
    return this.id.isIn(other);
  }
}
