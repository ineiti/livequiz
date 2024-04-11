import { JSONBlobUpdateReply, JSONBlobUpdateRequest, StorageHandler, Blob } from './storage.service';

class NetworkSimul {
  requests: JSONBlobUpdateRequest[] = [];
  replies: JSONBlobUpdateReply[] = [];
  constructor(messages?: JSONBlobUpdateReply[]) {
    if (messages !== undefined) {
      this.replies = messages;
    }
  }

  async getBlobUpdates(request: JSONBlobUpdateRequest): Promise<JSONBlobUpdateReply> {
    this.requests.push(request);
    return Promise.resolve(this.replies.shift() || { blobData: {} });
  }
}

class Test {
  simul0 = new NetworkSimul()
  storage0 = new StorageHandler(this.simul0);
  simul1 = new NetworkSimul()
  storage1 = new StorageHandler(this.simul1);

  addReply(simul: number, blob?: Blob) {
    const reply = blob !== undefined ? {
      blobData: {
        [blob.id.to_hex()]:
          { version: blob.version, json: blob.toJson() }
      }
    } : { blobData: {} };
    if (simul === 0) {
      this.simul0.replies.push(reply);
    } else {
      this.simul1.replies.push(reply);
    }
  }
}

describe('StorageHandler', () => {

  it('stores and replies with new blob', async () => {
    const storage = new StorageHandler(new NetworkSimul([]));
    const mine = new MyBlob("foo");
    storage.addBlob(mine);
    const mine2 = await storage.getBlob(mine.id, new MyBlob());
    expect(mine.toJson()).toBe(mine2.toJson());
  });

  it('can get blobs from the network', async () => {
    const test = new Test();
    test.addReply(0);
    const mine = new MyBlob("foo");
    test.storage0.addBlob(mine);
    test.storage0.syncBlobs();
    expect(test.simul0.requests.length).toBe(1);
    expect(test.simul0.requests[0].blobVersions[mine.id.to_hex()]!.version).toBe(1);
    expect(test.simul0.requests[0].blobVersions[mine.id.to_hex()]!.json).toBe(mine.toJson());

    test.simul1.replies.push({
      blobData: { [mine.id.to_hex()]: { version: 1, json: mine.toJson() } }
    })
    const mine2 = await test.storage1.getBlob(mine.id, new MyBlob());
    expect(mine.toJson() === mine2.toJson())
  });

  it('correctly updates blobs with conflicts', async () => {
    const test = new Test();
    let mine = new MyBlob("foo");
    mine.version = 2;
    test.storage0.addBlob(mine);
    const mineRemote = mine.clone();
    mineRemote.name = "bar";
    test.storage1.addBlob(mineRemote);

    // syncBlobs updates the local blob
    test.addReply(0, mineRemote);
    await test.storage0.syncBlobs();
    expect(mine.toJson()).toBe(mineRemote.toJson());
    expect(mineRemote.version).toBe(2);

    // changing a blob and calling syncBlob increases the version.
    mineRemote.maps.set(0, "zero");
    await test.storage1.syncBlobs();
    expect(mineRemote.version).toBe(3);

    // conflicting versions are sent again if the update method
    // is correctly written.
    mineRemote.version = 4;
    test.addReply(0, mineRemote);
    mine.maps.set(0, "Null");
    mine.maps.set(1, "Eins");
    await test.storage0.syncBlobs();
    expect(mine.version).toBe(4);
    await test.storage0.syncBlobs();
    expect(mine.version).toBe(5);
  });
});

class MyBlob extends Blob {
  name: string = "";
  maps: Map<number, string> = new Map();

  constructor(name?: string) {
    super();
    if (name !== undefined) {
      this.name = name;
    }
  }

  override toJson(): string {
    return JSON.stringify({ name: this.name, maps: [...this.maps] });
  }

  override update() {
    const content = JSON.parse(this.json);
    this.name = content.name;
    this.updateMap(this.maps, content.maps);
  }

  clone(): MyBlob {
    const c = new MyBlob(this.name);
    c.id = this.id;
    c.version = this.version;
    return c;
  }
}