/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix for @smithy/core/client missing index.d.ts
// The exports field in @smithy/core/package.json points to a non-existent
// dist-types/submodules/client/index.d.ts, so we declare the module here.
declare module "@smithy/core/client" {
  export class Client<
    HandlerOptions,
    ClientInput extends object,
    ClientOutput,
    ResolvedClientConfiguration
  > {
    readonly config: ResolvedClientConfiguration;
    constructor(config: ResolvedClientConfiguration);
    send(command: any, options?: any): Promise<any>;
    destroy(): void;
  }
  export type SmithyConfiguration<HandlerOptions> = {
    requestHandler: any;
  };
  export type SmithyResolvedConfiguration<HandlerOptions> = {
    requestHandler: any;
  };
}

declare module "bullmq" {
  export class Queue {
    constructor(name: string, opts?: any);
    add(name: string, data: any, opts?: any): Promise<any>;
  }
  export class Worker {
    constructor(
      name: string,
      processor: (job: Job) => Promise<void>,
      opts?: any
    );
  }
  export class Job {
    data: any;
  }
}
