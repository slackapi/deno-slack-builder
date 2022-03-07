import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.128.0/fs/mod.ts"
import { Options } from './types.ts';

// deno-lint-ignore no-explicit-any
export const createFunctions = async (options: Options, manifest: any) => {
  if (!options.outputDirectory) {
    throw new Error('Cannot build function files if no output option is provided');
  }

  // Ensure functions directory exists
  const functionsPath = path.join(options.outputDirectory, 'functions');
  await ensureDir(functionsPath);

  // Find all the run on slack functions
  for (const fnId in manifest.functions) {
    const fnDef = manifest.functions[fnId];

    // For now we'll bundle all functions until this is available on a manifest
    // TODO: add this check back once we add it to the manifest definition
    // if (fnDef.runtime_environment !== 'slack') {
    //   continue;
    // }

    if (!fnDef.source_file) {
      throw new Error(`Run on Slack function provided for ${fnDef.id}, but no source_file was provided.`)
    }

    const fnFilePath = path.join(options.workingDirectory, fnDef.source_file);

    // Make sure it's a file
    try {
      const { isFile } = await Deno.stat(fnFilePath);
      if (!isFile) {
        throw new Error(`Could not find file: ${fnFilePath}`);
      }
    }catch(e) {
      throw new Error(e);
    }


    // Bundle File
    const result = await Deno.emit(fnFilePath, {
      bundle: "module",
      check: false,
    });

    // Write FN File and sourcemap file
    const fnFileRelative = path.join('functions', `${fnId}.js`);
    const fnBundledPath = path.join(options.outputDirectory, fnFileRelative);
    const fnSourcemapPath = path.join(options.outputDirectory, 'functions', `${fnId}.js.map`);
    
    options.log(`wrote function file: ${fnFileRelative}`)
    try {
      await Deno.writeTextFile(fnBundledPath, result.files["deno:///bundle.js"]);
      await Deno.writeTextFile(fnSourcemapPath, result.files["deno:///bundle.js.map"]);
    }catch(e) {
      options.log(e);
      throw new Error(`Error writing bundled function file: ${fnDef.id}`, e)
    }
  }
}