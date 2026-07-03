// Minimal ambient declaration for hellosign-embedded (Dropbox Sign embedded
// signing SDK, v2.x), which ships no bundled types. Only the surface we use is
// declared here.
declare module "hellosign-embedded" {
  export interface HelloSignOptions {
    clientId?: string;
    skipDomainVerification?: boolean;
    testMode?: boolean;
    debug?: boolean;
    container?: HTMLElement;
    allowCancel?: boolean;
  }

  export interface HelloSignOpenOptions {
    clientId?: string;
    skipDomainVerification?: boolean;
    testMode?: boolean;
    redirectTo?: string;
    allowCancel?: boolean;
    container?: HTMLElement;
  }

  export default class HelloSign {
    constructor(options?: HelloSignOptions);
    open(url: string, options?: HelloSignOpenOptions): void;
    close(): void;
    on(event: string, callback: (data?: unknown) => void): this;
    once(event: string, callback: (data?: unknown) => void): this;
    off(event: string, callback?: (data?: unknown) => void): this;
    static events: Record<string, string>;
  }
}
