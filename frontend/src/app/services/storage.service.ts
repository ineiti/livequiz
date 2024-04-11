import { sha256 } from "js-sha256";
import { Buffer } from "buffer";

import { Injectable } from '@angular/core';
import { ConnectionService } from './connection.service';

interface ConnectionUpdate {
  getBlobUpdates(updates: JSONBlobUpdateRequest): Promise<JSONBlobUpdateReply>;
}

export class StorageHandler {
  cache: Map<string, Blob> = new Map();
  timeout?: any;

  constructor(private connection: ConnectionUpdate) {
  }

  // Adds a new blob to the local cache and sends it in the next
  // updateLoop to the server.
  addBlob(blob: Blob) {
    this.cache.set(blob.id.toHex(), blob);
  }

  startUpdate() {
    this.timeout = setTimeout(() => this.updateLoop(), 0);
  }

  // Is called every 2 seconds and synchronizes the blobs on the client with
  // those on the server.
  updateLoop() {
    // Avoid calling updateLoop in parallel - while updateBlobs is called,
    // another setTimeout might call updateLoop again. Ignore if this happens.
    if (this.timeout === undefined) {
      return;
    }
    // updateLoop can be called from the outside to force an update. In this
    // case the scheduled update should not happen.
    clearTimeout(this.timeout);
    this.timeout = undefined;
    this.syncBlobs().then((duration) => {
      if (duration > 100) {
        alert("Serializing all this stuff takes more than 100ms!");
      } else {
        console.log(`Duration for serializing ${this.cache.size} blobs: ${duration}ms`);
      }
      this.timeout = setTimeout(() => this.updateLoop(), 2000);
    });
  }

  // Returns a blob - either from the cache, or from the server.
  async getBlob<T extends Blob>(id: BlobID, blob: T): Promise<T> {
    if (this.cache.has(id.toHex())) {
      return this.cache.get(id.toHex())! as T;
    }

    const reply = await this.connection.getBlobUpdates({
      blobVersions: { [id.toHex()]: { version: 0 } }
    });
    const blobData = reply.blobData[id.toHex()];
    if (blobData === undefined) {
      throw new Error("Unknown blob on server");
    }
    blob.id = id;
    blob.version = blobData.version;
    blob.json = blobData.json;
    blob.update();
    this.cache.set(id.toHex(), blob);
    return blob;
  }

  // Synchronizes the blobs. First sends all the clients blob versions,
  // then updates those received from the server.
  // Concurrent updates must be handled by the blobs themselves.
  async syncBlobs(): Promise<number> {
    const start = Date.now();
    // Gather all local versions of the blobs.
    const request: JSONBlobUpdateRequest = {
      blobVersions: Object.fromEntries(
        [...this.cache.entries()]
          .map(([k, b]) => [k, { version: b.version }]))
    };

    // Add data for all changed blobs - this might be too slow with many blobs.
    for (const [k, b] of this.cache.entries()) {
      const json = b.toJson();
      if (json !== b.json) {
        b.json = json;
        b.version++;
        request.blobVersions[k] = { json, version: b.version };
      }
    }
    const duration = Date.now() - start;

    const updates = await this.connection.getBlobUpdates(request);
    for (const [k, d] of Object.entries(updates.blobData)) {
      const blob = this.cache.get(k);
      if (blob !== undefined) {
        blob.version = d.version;
        blob.json = d.json;
        blob.update();
      }
    }
    return duration;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StorageService extends StorageHandler {
  constructor(connection: ConnectionService) {
    super(connection);
    this.startUpdate();
  }
}

// 1st the client sends the blobIDs and the versions, plus any local updates.
// This supposes that conflicts are less common than successful updates.
// If it turns out that conflicts are more common, 
// this should only send whether the object has been changed locally.
export interface JSONBlobUpdateRequest {
  blobVersions: { [key: string]: { version: number, json?: string } };
}

// 2nd the server replies with new blob datas.
// This includes blobs for which the client sent an update, but which
// have changed in between on the server.
// If the client sent an update for an outdated blob, the client must
// first update its blob, then send it again.
// It is up to the client to decide what to do with conflicting fields
// (the ones which changed on the client and on the server).
export interface JSONBlobUpdateReply {
  blobData: { [key: string]: { version: number, json: string } };
}

export interface JSONBlob {
  id: string;
  version: number;
  json: string;
}

interface BlobStorage {
  id: BlobID;
  version: number;
  // The json field is used to detect changes in the object.
  // It must only be read by the object, never written to.
  json: string;

  // The to_json must always return the same string, unless the object changed.
  toJson(): string;

  // Update deserializes the json from the json-field and updates its fields.
  // It must take care about concurrent changes.
  // The simplest way is to ignore concurrent changes with values, but at least make
  // sure that maps get merged correctly: e.g., by only allowing appending to maps.
  // This can be done by making sure that this object maps get written back to the
  // map received from the server.
  update(): void;
}

export class Blob implements BlobStorage {
  constructor(public id = new BlobID(), public version = 0, public json = "") {
  }

  toJson(): string {
    throw new Error("Method not implemented.");
  }
  update(): void {
    throw new Error("Method not implemented.");
  }
  updateMap<K extends (string | number | symbol), V>(map: Map<K, V>, json: [K, V][]) { 
    if (json.length > 0) {
      for (const [k, v] of json) {
        map.set(k, v);
      }
    }
  }
}

export class H256 {
  data = new ArrayBuffer(32);
  idStr = "H256";
  constructor(init?: ArrayBuffer) {
    if (init !== undefined) {
      this.data = init;
    } else {
      crypto.getRandomValues(new Uint8Array(this.data));
    }
  }

  hash(): ArrayBuffer {
    const hash = sha256.create();
    hash.update(this.data);
    return hash.arrayBuffer();
  }

  static fromHex(hex: string): H256 {
    return new H256(Buffer.from(hex, "hex"));
  }

  toHex(): string {
    return Buffer.from(this.data).toString('hex');
  }

  equals(other: H256): boolean {
    return Buffer.from(other.data).equals(Buffer.from(this.data));
  }

  isIn(other: H256[]): boolean {
    return other.findIndex((o) => o.equals(this)) >= 0;
  }

  toString(): string {
    return `${this.idStr}:${this.toHex()}`;
  }
}

export class BlobID extends H256 {
  constructor(init?: ArrayBuffer) {
    super(init);
    this.idStr = "BlobID";
  }

  static fromGlobalID(id: string): BlobID {
    const hash = sha256.create();
    hash.update(id);
    return new BlobID(hash.arrayBuffer());
  }
}
