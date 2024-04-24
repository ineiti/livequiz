import { StorageHandler } from './storage.service';
import { JSONNomadUpdateReply, JSONNomadUpdateRequest } from '../../lib/storage';
import { Nomad } from "../../lib/storage";

class NetworkSimul {
  requests: JSONNomadUpdateRequest[] = [];
  replies: JSONNomadUpdateReply[] = [];
  constructor(messages?: JSONNomadUpdateReply[]) {
    if (messages !== undefined) {
      this.replies = messages;
    }
  }

  async getNomadUpdates(request: JSONNomadUpdateRequest): Promise<JSONNomadUpdateReply> {
    this.requests.push(request);
    return Promise.resolve(this.replies.shift() || { nomadData: {} });
  }
}

class Test {
  simul0 = new NetworkSimul()
  storage0 = new StorageHandler(this.simul0);
  simul1 = new NetworkSimul()
  storage1 = new StorageHandler(this.simul1);

  addReply(simul: number, nomad?: Nomad) {
    const reply = nomad !== undefined ? {
      nomadData: {
        [nomad.id.toHex()]:
          { version: nomad.version, json: nomad.toJson() }
      }
    } : { nomadData: {} };
    if (simul === 0) {
      this.simul0.replies.push(reply);
    } else {
      this.simul1.replies.push(reply);
    }
  }
}

describe('StorageHandler', () => {

  it('stores and replies with new nomad', async () => {
    const storage = new StorageHandler(new NetworkSimul([]));
    const mine = new MyNomad("foo");
    storage.addNomads(mine);
    const mine2 = await storage.getNomad(mine.id, new MyNomad());
    expect(mine.toJson()).toBe(mine2.toJson());
  });

  it('can get nomads from the network', async () => {
    const test = new Test();
    test.addReply(0);
    const mine = new MyNomad("foo");
    test.storage0.addNomads(mine);
    test.storage0.syncNomads();
    expect(test.simul0.requests.length).toBe(1);
    expect(test.simul0.requests[0].nomadVersions[mine.id.toHex()]!.version).toBe(1);
    expect(test.simul0.requests[0].nomadVersions[mine.id.toHex()]!.json).toBe(mine.toJson());

    test.simul1.replies.push({
      nomadData: { [mine.id.toHex()]: { version: 1, json: mine.toJson() } }
    })
    const mine2 = await test.storage1.getNomad(mine.id, new MyNomad());
    expect(mine.toJson() === mine2.toJson())
  });

  it('correctly updates nomads with conflicts', async () => {
    const test = new Test();
    let mine = new MyNomad("foo");
    mine.version = 2;
    test.storage0.addNomads(mine);
    const mineRemote = mine.clone();
    mineRemote.name = "bar";
    test.storage1.addNomads(mineRemote);

    // syncNomads updates the local nomad
    test.addReply(0, mineRemote);
    await test.storage0.syncNomads();
    expect(mine.toJson()).toBe(mineRemote.toJson());
    expect(mineRemote.version).toBe(2);

    // changing a nomad and calling syncNomad increases the version.
    mineRemote.maps.set(0, "zero");
    await test.storage1.syncNomads();
    expect(mineRemote.version).toBe(3);

    // conflicting versions are sent again if the update method
    // is correctly written.
    mineRemote.version = 4;
    test.addReply(0, mineRemote);
    mine.maps.set(0, "Null");
    mine.maps.set(1, "Eins");
    await test.storage0.syncNomads();
    expect(mine.version).toBe(4);
    await test.storage0.syncNomads();
    expect(mine.version).toBe(5);
  });
});

class MyNomad extends Nomad {
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

  clone(): MyNomad {
    const c = new MyNomad(this.name);
    c.id = this.id;
    c.version = this.version;
    return c;
  }
}