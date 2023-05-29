interface ObscureIdOptions {
  key?: string;
  charset?: string;
  defaultIdLength?: number;
  prefixLength?: number;
  randomFunction?: () => Promise<number>;
}

function obscureId(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
function obscureId(id: string): Promise<number>;

namespace obscureId {
  export function configure(options: ObscureIdOptions): void;
  export function resetConfiguration(): void;
  export function maxId(length?: number): number;

  export class ObscuredIdGenerator {
    constructor(options?: ObscureIdOptions);
    configure(options: ObscureIdOptions): this;
    resetConfiguration(): this;
    maxId(length?: number): number;
    obscureId(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
    generate(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
    encode(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
    obscureId(id: string): Promise<number>;
    decode(id: string): Promise<number>;
  }
}

export = obscureId;
