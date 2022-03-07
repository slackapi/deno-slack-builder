import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import { createManifest } from './manifest.ts';
import { createFunctions } from './functions.ts'
import { Options } from './types.ts'

const run = async() => {
  const start = Date.now();
  // We could add additional arguments to indicate things like only generate the manifest, or only functions
  const { source, output } = parse(Deno.args);

  const workingDirectory = path.join(Deno.cwd(), source);
  const outputDirectory = path.join(Deno.cwd(), output);

  // TODO: We could incorporate reading in a cli.json file if present, and respect anything there that's relevant
  // such as a `manifestFile` property that specifies a manifest locaiton

  const options: Options = {
    workingDirectory,
    outputDirectory,
  }
  console.log('options', options)

  // Generate Manifest
  const manifest = await createManifest(options);

  await createFunctions(options, manifest);
  const duration = Date.now() - start;
  console.log(`duration: ${duration}ms`)
}

run();