import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import { deepMerge } from "https://deno.land/std/collections/mod.ts";
import { Options } from './types.ts';

const DENO_RUNTIME_DEFAULT = 'deno1.x';

// Responsible for taking a working directory, and an output directory
// and placing a manifest.json in the root of the output directory

export const createManifest = async (options: Options) => {
  let manifest: any = {};

  const manifestJSON = await readManifestJSONFile(options);
  if (manifestJSON !== false) {
    manifest = deepMerge(manifest, manifestJSON);
  }

  // First check if there's a manifest.ts file
  const manifestTS = await readImportedManifestFile(options, 'manifest.ts');
  if (manifestTS === false) {
    // Now check for a manifest.js file
    const manifestJS = await readImportedManifestFile(options, 'manifest.js');
    if (manifestJS !== false) {
      manifest = deepMerge(manifest, manifestJS);
    }
  }else {
    manifest = deepMerge(manifest, manifestTS);
  }

  if(!manifest.runtime) {
    // Maybe we grab this version from an api instead of hard-coded in the library?
    manifest.runtime = DENO_RUNTIME_DEFAULT;
  }

  // TODO: should this just happen in the createManifest 
  await Deno.writeTextFile(path.join(options.outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`wrote manifest.json`);
    
  return manifest;
}

async function readManifestJSONFile (options: Options) {
    // Look for manifest.json in working directory
    let manifestJSON: any = {};
    const manifestJSONFilePath = path.join(options.workingDirectory, 'manifest.json');
    // - use as baseline

    try {
      const { isFile } = await Deno.stat(manifestJSONFilePath);
      console.log('manifest.json', isFile);

      if (!isFile) {
          return false;
      }
    }catch(e) {
      return false;
    }

    try {
        const jsonString = await Deno.readTextFile(manifestJSONFilePath);
        manifestJSON = JSON.parse(jsonString);
    } catch (err) {
        throw err;
    }

    return manifestJSON
}

async function readImportedManifestFile(options: Options, filename: string) {
  // Look for manifest.js in working directory
  // - if present, default export should be a manifest json object
  let manifestJS: any = {};
  const manifestJSFilePath = path.join(options.workingDirectory, filename);
  // - use as baseline

  try {
    const { isFile } = await Deno.stat(manifestJSFilePath);
    console.log(filename, isFile);

    if (!isFile) {
      return false;
    }
  } catch (e) {
    return false;
  }

  try {
    const manifestJSFile = await import(`file://${manifestJSFilePath}`)
    if (manifestJSFile && manifestJSFile.default) {
      manifestJS = manifestJSFile.default;
    }
  } catch (err) {
    throw err;
  }

  return manifestJS;
}
