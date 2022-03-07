
export type Options = {
  manifestOnly: boolean,
  workingDirectory: string,
  outputDirectory?: string,
  // deno-lint-ignore no-explicit-any
  log: (...args: any) => void,
}
