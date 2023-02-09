import { Options } from "./types.ts";
import { deepMerge, path } from "./deps.ts";

// Responsible for taking a working directory, and an output directory
// and placing a manifest.json in the root of the output directory

export const createManifest = async (options: Options) => {
  let foundManifest = false;
  // deno-lint-ignore no-explicit-any
  let manifest: any = {};

  const manifestJSON = await readManifestJSONFile(options);
  if (manifestJSON !== false) {
    manifest = deepMerge(manifest, manifestJSON);
    foundManifest = true;
  }

  // First check if there's a manifest.ts file
  const manifestTS = await readImportedManifestFile(options, "manifest.ts");
  if (manifestTS === false) {
    // Now check for a manifest.js file
    const manifestJS = await readImportedManifestFile(options, "manifest.js");
    if (manifestJS !== false) {
      manifest = deepMerge(manifest, manifestJS);
      foundManifest = true;
    }
  } else {
    manifest = deepMerge(manifest, manifestTS);
    foundManifest = true;
  }

  if (!foundManifest) {
    throw new Error(
      "Could not find a manifest.json, manifest.ts or manifest.json file",
    );
  }

  return manifest;
};

// Remove any properties in the manifest specific to the tooling that don't belong in the API payloads
// deno-lint-ignore no-explicit-any
export const cleanManifest = (manifest: any) => {
  for (const fnId in manifest.functions) {
    const fnDef = manifest.functions[fnId];
    delete fnDef.source_file;
  }

  return manifest;
};

async function readManifestJSONFile(options: Options) {
  // Look for manifest.json in working directory
  // deno-lint-ignore no-explicit-any
  let manifestJSON: any = {};
  const manifestJSONFilePath = path.join(
    options.workingDirectory,
    "manifest.json",
  );
  // - use as baseline

  try {
    const { isFile } = await Deno.stat(manifestJSONFilePath);

    if (!isFile) {
      return false;
    }
  } catch (_e) {
    return false;
  }

  try {
    const jsonString = await Deno.readTextFile(manifestJSONFilePath);
    manifestJSON = JSON.parse(jsonString);
  } catch (err) {
    throw err;
  }

  return manifestJSON;
}

async function readImportedManifestFile(options: Options, filename: string) {
  // Look for manifest.js in working directory
  // - if present, default export should be a manifest json object
  // deno-lint-ignore no-explicit-any
  let manifestJS: any = {};
  const manifestJSFilePath = path.join(options.workingDirectory, filename);

  try {
    const { isFile } = await Deno.stat(manifestJSFilePath);

    if (!isFile) {
      return false;
    }
  } catch (_e) {
    return false;
  }

  let manifestJSFile;
  // To enable userland logging, in case the protocol in use uses something
  // other than stdout for diagnostic information, we stub over console.log
  // with the negotiated protocol's logging implementation, just in case.
  const originalLog = globalThis.console.log;
  globalThis.console.log = options.protocol.log;
  try {
    manifestJSFile = await import(`file://${manifestJSFilePath}`);
  } catch (err) {
    // Restore original logging behaviour in case of exception.
    globalThis.console.log = originalLog;
    throw err;
  }
  // Restore original logging behaviour when everything is good too.
  globalThis.console.log = originalLog;
  if (manifestJSFile && manifestJSFile.default) {
    manifestJS = manifestJSFile.default;
  }

  return manifestJS;
}
