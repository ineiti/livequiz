import { Injectable } from '@angular/core';

import { ConnectionMock } from "../../lib/connection_mock";
import { UserService } from "./user.service";
import { environment } from "../../environments/environment";
import { NomadID, UserID } from "../../lib/ids";
import { Nomad } from "../../lib/storage";
import { JSONNomadUpdateRequest, JSONNomadUpdateReply } from '../../lib/storage';
import { Subject } from 'rxjs';
import { Connection } from '../../lib/connection';

interface ConnectionUpdate {
  getNomadUpdates(updates: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply>;
}

export class StorageHandler {
  cache: Map<string, Nomad> = new Map();
  timeout?: any;
  updateObserver = new Subject<NomadID[]>();
  connection!: ConnectionUpdate;

  constructor() {
  }

  // Adds one or more new nomads to the local cache and sends them in the next
  // updateLoop to the server.
  // This throws an error if one or more of the nomads already exist.
  addNomads(...nomads: Nomad[]) {
    for (const nomad of nomads) {
      if (this.cache.has(nomad.id.toHex())) {
        throw new Error("This nomad id already exists");
      }
      this.cache.set(nomad.id.toHex(), nomad);
    }
  }

  // Removes these nomads from the cache.
  // The server still keeps them, so this will not remove them.
  // But it's useful if a big operation with lots of nomads took place.
  async clearNomads(...nomads: Nomad[]) {
    // Wait for the system not updating the nomads.
    while (this.timeout === undefined) {
      await new Promise((resolve) => setTimeout(resolve, environment.syncInterval / 2));
    }

    for (const nomad of nomads){
      this.cache.delete(nomad.id.toHex());
    }
  }

  // Returns an array of Nomads and makes sure that they are correctly fetched
  // from the server.
  // It takes an array of Ids, and a callback to create a new Nomad with the given ID.
  async getNomads<T extends Nomad>(nomadIds: NomadID[], newNomad: (id: NomadID) => T): Promise<T[]> {
    const nomadIdHexs = nomadIds.map((id) => id.toHex());
    const missing = nomadIdHexs.filter((id) => !this.cache.has(id));
    if (missing.length > 0) {
      for (const n of missing) {
        const nn = newNomad(NomadID.fromHex(n));
        nn.json = nn.toJson();
        this.cache.set(n, nn);
      }
      await this.updateLoop();
    }
    return nomadIdHexs.map((id) => this.cache.get(id) as T).filter((n) => n !== undefined)
  }

  startUpdate() {
    this.timeout = setTimeout(async () => { await this.updateLoop() }, 0);
  }

  // Is called every 2 seconds and synchronizes the nomads on the client with
  // those on the server.
  async updateLoop() {
    // Avoid calling updateLoop in parallel - while updateNomads is called,
    // another setTimeout might call updateLoop again. Ignore if this happens.
    if (this.timeout === undefined) {
      console.warn("Waiting for update because syncNomads currently running");
      await new Promise((resolve) => setTimeout(resolve, environment.syncInterval / 2));
      await this.updateLoop();
      return;
    }
    // updateLoop can be called from the outside to force an update. In this
    // case the scheduled update should not happen.
    clearTimeout(this.timeout);
    this.timeout = undefined;
    const duration = await this.syncNomads()
    if (duration > 10) {
      alert("Serializing all this stuff takes more than 10ms!");
    // } else {
    //   console.log(`${this.cache.size} nomads: ${duration}ms`);
    }
    this.timeout = setTimeout(() => this.updateLoop(), environment.syncInterval);
  }

  // Returns a nomad - either from the cache, or from the server.
  async getNomad<T extends Nomad>(id: NomadID, nomad: T): Promise<T> {
    if (this.cache.has(id.toHex())) {
      return this.cache.get(id.toHex())! as T;
    }

    const reply = await this.connection.getNomadUpdates({
      nomadVersions: { [id.toHex()]: { version: 0 } }
    });
    const nomadData = reply.nomadData[id.toHex()];
    if (nomadData === undefined) {
      throw new Error("Unknown nomad on server");
    }
    nomad.id = id;
    nomad.version = nomadData.version;
    nomad.json = nomadData.json;
    nomad.owners = nomadData.owners.map((owner) => UserID.fromHex(owner));
    nomad.update();
    this.cache.set(id.toHex(), nomad);
    return nomad;
  }

  // Synchronizes the nomads. First sends all the clients nomad versions,
  // then updates those received from the server.
  // Concurrent updates must be handled by the nomads themselves.
  private async syncNomads(): Promise<number> {
    const start = Date.now();
    const updateIds: NomadID[] = [];

    // Gather all local versions of the nomads.
    const request: JSONNomadUpdateRequest = {
      nomadVersions: Object.fromEntries(
        [...this.cache.entries()]
          .map(([k, b]) => [k, { version: b.version }]))
    };

    // Add data for all changed nomads - this might be too slow with many nomads.
    for (const [k, b] of this.cache.entries()) {
      const json = b.toJson();
      if (json !== b.json) {
        b.json = json;
        b.version++;
        request.nomadVersions[k] = b.getReply();
        // console.log("Sending new version of", b.constructor.name, b.getReply());
        updateIds.push(b.id);
      }
    }
    const duration = Date.now() - start;

    const updates = await this.connection.getNomadUpdates(request);
    for (const [k, server] of Object.entries(updates.nomadData)) {
      const nomad = this.cache.get(k);
      if (nomad !== undefined) {
        // console.log("Got new version", server);
        nomad.version = server.version;
        nomad.json = server.json;
        nomad.update();
        nomad.updated.next(server.json);

        updateIds.push(nomad.id);
      } else {
        console.warn("Got nomad with unknown id", server);
      }
    }

    // console.log("Sync done for", updateIds.length);
    this.updateObserver.next(updateIds);

    return duration;
  }
}

interface ConnectionUpRes extends ConnectionUpdate {
  reset(): Promise<any>;
}

function getConnection(user: UserService): ConnectionUpRes {
  if (environment.realBackend) {
    const base = document.location.host.startsWith("localhost") ? "http://localhost:8000" : document.location.origin;
    return new Connection(base, user.secret);
  } else {
    const connection = new ConnectionMock();
    connection.initBasic(user);
    return connection;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService extends StorageHandler {
  conn: ConnectionUpRes;

  constructor(user: UserService) {
    super();
    this.conn = getConnection(user);
    this.connection = this.conn;
    // This is not really nice, but is needed for the integration tests to work.
    // For a production system, the 'reset' endpoint is not active.
    if (environment.enableReset && window.location.hash == "#reset") {
      this.reset().then(() => this.startUpdate());
    } else {
      this.startUpdate();
    }
  }

  async reset() {
    await this.conn.reset();
  }
}
