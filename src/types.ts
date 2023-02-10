import type { Protocol } from "./deps.ts";

/**
 * A general-purpose bag-of-options for use in all sub-functions in this project
 */
export type Options = {
  manifestOnly: boolean;
  workingDirectory: string;
  outputDirectory?: string;
  protocol: Protocol;
};
