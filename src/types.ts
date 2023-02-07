export type Options = {
  manifestOnly: boolean;
  workingDirectory: string;
  outputDirectory?: string;
};

export interface Protocol {
  log: typeof console.log;
  error: typeof console.error;
  warn: typeof console.warn;
  // deno-lint-ignore no-explicit-any
  respond: (data: any) => void;
}
