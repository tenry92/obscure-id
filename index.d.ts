declare module 'obsure-id' {
  interface ObscureIdOptions {
    key?: string;
    index?: string;
    defaultIdLength?: number;
    prefixLength?: number;
    randomFunction?: () => Promise<number>;
  }

  function obscureId(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
  function obscureId(id: string): Promise<number>;

  namespace obscureId {
    export function configure(options: ObscureIdOptions);
    export function resetConfiguration();
    export function maxId(length?: number): number;

    export class ObscuredIdOptions {
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
}
