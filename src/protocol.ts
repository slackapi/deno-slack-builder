import { parse } from "./deps.ts";
import { Protocol } from "./types.ts";

// List of slack-cli communication protocols supported
const SUPPORTED_NAMED_PROTOCOLS = [
  "dont-cross-the-streams",
  "message-boundaries",
];

/**
 * The baseline CLI<=> SDK protocol: all hook responses from this project go to stdout,
 * and the CLI reads both stdout and stderr and combines them to interpret the hook response.
 * This simplistic protocol has inherent limitations: cannot log diagnostic info!
 * @param args command-line arguments passed to this process
 * @returns {Protocol}
 */
export const BaseProtocol = function (args: string[]): Protocol {
  const { manifest: manifestOnly = false } = parse(args);
  const loggerMethod = manifestOnly ? () => {} : console.log;
  return {
    log: loggerMethod,
    error: loggerMethod,
    warn: loggerMethod,
    respond: console.log,
  };
};

/**
 * An example protocol implementation using stdout and stderr for separate purposes.
 * stdout is reserved for hook responses, and stderr for diagnostic information.
 * While this implementation is simple, it requires mocking out the global runtime logging
 * methods to ensure userland code does not write to stdout or stderr in a way that violates
 * the rules of this protocol.
 */
export const DontCrossTheStreamsProtocol = function (): Protocol {
  const originalConsole = globalThis.console;
  const protObj = {
    log: console.error,
    error: console.error,
    warn: console.error,
    respond: console.log,
    install: () => {
      // This protocol implementation pumps diagnostic info over stderr, so we ensure all console logging methods
      // redirect to stderr instead of stdout - so override the global console.* methods with our own that point
      // to console.error (which writes to stderr)
      globalThis.console.log = protObj.log;
      globalThis.console.error = protObj.error;
      globalThis.console.warn = protObj.warn;
    },
    uninstall: () => {
      // Restore original console functionality.
      globalThis.console.log = originalConsole.log;
      globalThis.console.error = originalConsole.error;
      globalThis.console.warn = originalConsole.warn;
    },
  };
  return protObj;
};

/**
 * An example protocol implementation that only uses stdout, but uses message boundaries to differentiate between
 * diagnostic information and hook responses.
 */
export const MessageBoundaryProtocol = function (args: string[]): Protocol {
  const { boundary } = parse(
    args,
  );
  if (!boundary) throw new Error("no boundary argument provided!");
  return {
    log: console.log,
    error: console.log, // TODO: this could just as easily remain as console.error (i.e stderr) - BUT - we need to ensure that on the CLI side, we stream hook stderr out straight to the user
    warn: console.log, // TODO: same as previous line
    // deno-lint-ignore no-explicit-any
    respond: (data: any) => {
      console.log(boundary + "\n" + data + boundary);
    },
  };
};

// A map of protocol names to protocol implementations
const PROTOCOL_MAP = {
  [SUPPORTED_NAMED_PROTOCOLS[0]]: DontCrossTheStreamsProtocol,
  [SUPPORTED_NAMED_PROTOCOLS[1]]: MessageBoundaryProtocol,
};

export const getProtocolInterface = function (args: string[]): Protocol {
  const { protocol: protocolFromCLI } = parse(
    args,
  );
  if (protocolFromCLI) {
    if (SUPPORTED_NAMED_PROTOCOLS.includes(protocolFromCLI)) {
      const iface = PROTOCOL_MAP[protocolFromCLI];
      // Allow support for protocol implementations to either be:
      // - a function, that takes arguments passed to this process, to dynamically instantiate a Protocol interface
      // - an object implementing the Protocol interface directly
      if (typeof iface === "function") {
        return iface(args);
      } else {
        return iface;
      }
    }
  }
  // If protocol negotiation fails for any reason, return the base protocol
  // In the base protocol, if only a manifest is being requested, then we must
  // return the manifest JSON over stdout, so the logging interface passed into
  // BaseProtocol is a no-op function (to prevent logging to stdout)
  return BaseProtocol(args);
};
