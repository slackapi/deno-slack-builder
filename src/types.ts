/**
 * A general-purpose bag-of-options for use in all sub-functions in this project
 */
export type Options = {
  manifestOnly: boolean;
  workingDirectory: string;
  outputDirectory?: string;
  protocol: Protocol;
};

/**
 * An interface encapsulating a specific set of communication rules that both the SDK
 * and the CLI implement.
 */
export interface Protocol {
  /**
   * Logging utility allowing for SDK and userland code to log diagnostic info that will be surfaced by the CLI.
   */
  log: typeof console.log;
  /**
   * Logging utility allowing for SDK and userland code to log error info that will be surfaced by the CLI.
   */
  error: typeof console.error;
  /**
   * Logging utility allowing for SDK and userland code to provide warnings that will be surfaced by the CLI.
   */
  warn: typeof console.warn;
  /**
   * Utility method for responding to CLI hook invocations.
   * @param data Stringified JSON to return to the CLI
   * @returns
   */
  respond: (data: string) => void;
  /**
   * If necessary, provides an opportunity for the Protocol to install itself into the runtime (if protocol rules require it)
   * Some protocols may require special usage of process constructs, such as stdout, stderr, etc. which may require
   * clobbering of runtime globals.
   * @returns
   */
  install?: () => void;
  /**
   * If necessary, provides an opportunity for the Protocol to uninstall itself from the runtime (if protocol rules require it)
   * Some protocols may require special usage of process constructs, such as stdout, stderr, etc. which may require
   * clobbering of runtime globals.
   * @returns
   */
  uninstall?: () => void;
}
