import { parse } from "./deps.ts";
import { Protocol } from "./types.ts";

export const SUPPORTED_NAMED_PROTOCOLS = ["dont-cross-the-streams"];

export const BaseProtocol = function (
  loggerMethod: typeof console.log,
): Protocol {
  return {
    log: loggerMethod,
    error: loggerMethod,
    warn: loggerMethod,
    respond: console.log,
  };
};

export const DontCrossTheStreamsProtocol: Protocol = {
  log: console.error,
  error: console.error,
  warn: console.error,
  respond: console.log,
};

const PROTOCOL_MAP = {
  [SUPPORTED_NAMED_PROTOCOLS[0]]: DontCrossTheStreamsProtocol,
};

export const getProtocolInterface = function (args: string[]): Protocol {
  const { protocol: protocolFromCLI, manifest: manifestOnly = false } = parse(
    args,
  );
  if (protocolFromCLI) {
    if (SUPPORTED_NAMED_PROTOCOLS.includes(protocolFromCLI)) {
      return PROTOCOL_MAP[protocolFromCLI];
    }
  }
  // If protocol negotiation fails for any reason, return the base protocol
  // In the base protocol, if only a manifest is being requested, then we must
  // return the manifest JSON over stdout, so the logging interface passed into
  // BaseProtocol is a no-op function (to prevent logging to stdout)
  return BaseProtocol(manifestOnly ? () => {} : console.log);
};
