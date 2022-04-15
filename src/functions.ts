import { Options } from "./types.ts";
import { ensureDir, path } from "./deps.ts";

// deno-lint-ignore no-explicit-any
export const createFunctions = async (options: Options, manifest: any) => {
  if (!options.outputDirectory) {
    throw new Error(
      "Cannot build function files if no output option is provided",
    );
  }

  // Ensure functions directory exists
  const functionsPath = path.join(options.outputDirectory, "functions");
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
      throw new Error(
        `Run on Slack function provided for ${fnId}, but no source_file was provided.`,
      );
    }

    const fnFilePath = path.join(options.workingDirectory, fnDef.source_file);

    // Make sure it's a file
    try {
      const { isFile } = await Deno.stat(fnFilePath);
      if (!isFile) {
        throw new Error(`Could not find file: ${fnFilePath}`);
      }
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        throw new Error(
          `Could not find file: ${fnFilePath}. Make sure your function's "source_file" is relative to your project root.`,
        );
      }
      throw new Error(e);
    }

    // Bundle File
    let isImportMapPresent = false;
    const importMapPath = `${options.workingDirectory}/import_map.json`;

    try {
      const { isFile } = await Deno.stat(importMapPath);
      isImportMapPresent = isFile;
    } catch (_e) {
      isImportMapPresent = false;
    }

    const result = await Deno.emit(fnFilePath, {
      bundle: "module",
      check: false,
      importMapPath: isImportMapPresent ? importMapPath : undefined,
    });

    // Write FN File and sourcemap file
    const fnFileRelative = path.join("functions", `${fnId}.js`);
    const fnBundledPath = path.join(options.outputDirectory, fnFileRelative);
    const fnSourcemapPath = path.join(
      options.outputDirectory,
      "functions",
      `${fnId}.js.map`,
    );

    options.log(`wrote function file: ${fnFileRelative}`);
    try {
      await Deno.writeTextFile(
        fnBundledPath,
        result.files["deno:///bundle.js"],
      );
      await Deno.writeTextFile(
        fnSourcemapPath,
        result.files["deno:///bundle.js.map"],
      );
    } catch (e) {
      options.log(e);
      throw new Error(`Error writing bundled function file: ${fnId}`, e);
    }
  }
};
