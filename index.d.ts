declare module 'public-id' {
  interface PublicIdOptions {
    key?: string;
    index?: string;
    defaultIdLength?: number;
    signatureLength?: number;
    randomFunction?: () => Promise<number>;
  }
  
  function publicId(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
  function publicId(id: string): Promise<number>;
  
  namespace publicId {
    export function configure(options: PublicIdOptions);
    export function resetConfiguration();
    export function maxId(length?: number): number;
    
    export class PublicIdGenerator {
      constructor(options?: PublicIdOptions);
      configure(options: PublicIdOptions): this;
      resetConfiguration(): this;
      maxId(length?: number): number;
      publicId(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
      generate(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
      encode(id: number, length?: number, random?: number[] | (() => Promise<number>)): Promise<string>;
      publicId(id: string): Promise<number>;
      decode(id: string): Promise<number>;
    }
  }
  
  export = publicId;
}
