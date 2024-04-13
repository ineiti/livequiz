import { Injectable } from '@angular/core';

import { ConnectionMock } from "../../lib/connection_mock";
import { UserService } from "./user.service";
import { environment } from "../../environments/environment";
import { NomadID } from "../../lib/ids";
import { Nomad } from "../../lib/storage";
import { JSONNomadUpdateRequest, JSONNomadUpdateReply } from '../../lib/storage';

interface ConnectionUpdate {
  getNomadUpdates(updates: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply>;
}

export class StorageHandler {
  cache: Map<string, Nomad> = new Map();
  timeout?: any;

  constructor(private connection: ConnectionUpdate) {
  }

  // Adds a new nomad to the local cache and sends it in the next
  // updateLoop to the server.
  addNomad(nomad: Nomad) {
    this.cache.set(nomad.id.toHex(), nomad);
  }

  startUpdate() {
    this.timeout = setTimeout(() => this.updateLoop(), 0);
  }

  // Is called every 2 seconds and synchronizes the nomads on the client with
  // those on the server.
  updateLoop() {
    // Avoid calling updateLoop in parallel - while updateNomads is called,
    // another setTimeout might call updateLoop again. Ignore if this happens.
    if (this.timeout === undefined) {
      return;
    }
    // updateLoop can be called from the outside to force an update. In this
    // case the scheduled update should not happen.
    clearTimeout(this.timeout);
    this.timeout = undefined;
    this.syncNomads().then((duration) => {
      if (duration > 100) {
        alert("Serializing all this stuff takes more than 100ms!");
      } else {
        // console.log(`${this.cache.size} nomads: ${duration}ms`);
      }
      this.timeout = setTimeout(() => this.updateLoop(), 2000);
    });
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
    nomad.update();
    this.cache.set(id.toHex(), nomad);
    return nomad;
  }

  // Synchronizes the nomads. First sends all the clients nomad versions,
  // then updates those received from the server.
  // Concurrent updates must be handled by the nomads themselves.
  async syncNomads(): Promise<number> {
    const start = Date.now();
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
      }
    }
    const duration = Date.now() - start;

    const updates = await this.connection.getNomadUpdates(request);
    for (const [k, d] of Object.entries(updates.nomadData)) {
      const nomad = this.cache.get(k);
      if (nomad !== undefined) {
        nomad.version = d.version;
        nomad.json = d.json;
        nomad.update();
      }
    }
    return duration;
  }
}

function getConnection(user: UserService): ConnectionUpdate {
  const connection = new ConnectionMock();
  if (environment.realBackend) {
    //   const base = document.location.host.startsWith("localhost") ? "http://localhost:8000" : document.location.origin;
    //   this.connection = new Connection(base);
  } else {
    connection.initBasic(user.secret);
  }
  return connection;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService extends StorageHandler {
  constructor(user: UserService) {
    super(getConnection(user));
    this.addNomad(user);
    this.startUpdate();
  }
}
