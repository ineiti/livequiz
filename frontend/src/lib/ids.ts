import { Buffer } from "buffer";
import { sha256 } from "js-sha256";

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

export class NomadID extends H256 {
  constructor(init?: ArrayBuffer) {
    super(init);
    this.idStr = "NomadID";
  }

  static fromGlobalID(id: string): NomadID {
    const hash = sha256.create();
    hash.update(id);
    return new NomadID(hash.arrayBuffer());
  }
}

export class Secret {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    hash(): UserID {
        return new UserID(this.data.hash());
    }

    static from_hex(hex: string): Secret {
        return new Secret(H256.fromHex(hex).data);
    }

    toHex(): string {
        return this.data.toHex();
    }
}

export class UserID extends NomadID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "UserID";
    }
}

export class QuizID extends NomadID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "QuizID";
    }
}

export class DojoID extends NomadID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "DojoID";
    }
}

export class DojoAttemptID extends NomadID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "DojoAttemptID";
    }
}

export class StatsEntriesID extends NomadID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "StatsEntriesID";
    }
}
