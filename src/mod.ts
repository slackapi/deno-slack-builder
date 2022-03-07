import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import { createManifest } from './manifest.ts';
import { createFunctions } from './functions.ts'
import { Options } from './types.ts'

const run = async() => {
  const start = Date.now();
  // We could add additional arguments to indicate things like only generate the manifest, or only functions
  const { source, output, manifest: manifestOnly = false } = parse(Deno.args);

  // Not output required but only when only the manifest is being generated as it's printed to stdout
  if (!output && !manifestOnly) {
    throw new Error('An output option must be specified the --manifest flag is not set')
  }

  const workingDirectory = path.join(Deno.cwd(), source||"");
  const outputDirectory = output ? path.join(Deno.cwd(), output||"") : undefined;

  const options: Options = {
    manifestOnly,
    workingDirectory,
    outputDirectory,
    // deno-lint-ignore no-explicit-any
    log: (...args: any) => console.log(...args),
  }

  // Disable logging to stdout if we're outputing a manifest.json file to stdout
  if(options.manifestOnly) {
    options.log = () => {}
  }

  // Generate Manifest
  const generatedManifest = await createManifest(options);

  if (!options.manifestOnly) {
    await createFunctions(options, generatedManifest);
  }

  const duration = Date.now() - start;
  options.log(`duration: ${duration}ms`);
}

run();