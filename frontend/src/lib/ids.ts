import { H256 } from "../app/services/storage.service";

export class Secret {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    hash(): UserID {
        return new UserID(this.data.hash());
    }

    static from_hex(hex: string): Secret {
        return new Secret(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }
}

export class UserID {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    static from_hex(hex: string): UserID {
        return new UserID(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }

    is_in(other: UserID[]): boolean {
        return this.data.is_in(other.map((o) => o.data));
    }

    equals(other: UserID): boolean {
        return other.data.equals(this.data);
    }
}

export class CourseID {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    static from_hex(hex: string): CourseID {
        return new CourseID(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }

    equals(other: CourseID): boolean {
        return other.data.equals(this.data);
    }}

export class QuizID {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    static from_hex(hex: string): CourseID {
        return new QuizID(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }

    equals(other: QuizID): boolean {
        return other.data.equals(this.data);
    }
}

export class DojoID {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    static from_hex(hex: string): CourseID {
        return new DojoID(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }

    equals(other: DojoID): boolean {
        return other.data.equals(this.data);
    }
}

export class DojoResultID {
    data: H256;

    constructor(init?: ArrayBuffer) {
        this.data = new H256(init);
    }

    static from_hex(hex: string): CourseID {
        return new DojoResultID(H256.from_hex(hex).data);
    }

    to_hex(): string {
        return this.data.to_hex();
    }

    equals(other: DojoResultID): boolean {
        return other.data.equals(this.data);
    }
}