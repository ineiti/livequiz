import { BlobID, H256 } from "../app/services/storage.service";

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

export class UserID extends BlobID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "UserID";
    }
}

export class QuizID extends BlobID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "QuizID";
    }
}

export class DojoID extends BlobID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "DojoID";
    }
}

export class DojoAttemptID extends BlobID {
    constructor(init?: ArrayBuffer) {
        super(init);
        this.idStr = "DojoAttemptID";
    }
}