import { Options } from "./types.ts";
import { ensureDir, path } from "./deps.ts";

export const validateAndCreateFunctions = async (
  options: Options,
  // deno-lint-ignore no-explicit-any
  manifest: any,
) => {
  if (options.outputDirectory) {
    // Ensure functions directory exists
    const functionsPath = path.join(options.outputDirectory, "functions");
    await ensureDir(functionsPath);
  }

  // Find all the run on slack functions
  for (const fnId in manifest.functions) {
    const fnDef = manifest.functions[fnId];

    // For now we'll bundle all functions until this is available on a manifest
    // TODO: add this check back once we add it to the manifest definition
    // if (fnDef.runtime_environment !== 'slack') {
    //   continue;
    // }

    //For API type functions, there are no function files.
    if (fnDef.type === "API") {
      continue;
    }

    // Always validate function paths
    const fnFilePath = await getValidFunctionPath(options, fnId, fnDef);

    // Create function files if there is an output directory provided
    if (options.outputDirectory) {
      createFunctionFile(options as Required<Options>, fnId, fnFilePath);
    } else if (!options.outputDirectory && !options.manifestOnly) {
      // If no output directory and not just outputting manifest, throw error
      throw new Error(
        "Cannot build function files if no output option is provided",
      );
    }
  }
};

const functionPathHasDefaultExport = async (
  functionFilePath: string,
) => {
  const functionModule = await import(functionFilePath as string);
  return functionModule.default ? true : false;
};

const getValidFunctionPath = async (
  options: Options,
  fnId: string,
  // deno-lint-ignore no-explicit-any
  fnDef: any,
) => {
  if (!fnDef.source_file) {
    throw new Error(
      `Run on Slack function provided for ${fnId}, but no source_file was provided.`,
    );
  }

  const fnFilePath = path.join(options.workingDirectory, fnDef.source_file);

  // Make sure it's a file that exists
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

  if (!await functionPathHasDefaultExport(fnFilePath)) {
    throw new Error(
      `File: ${fnFilePath}, containing your function does not define a default export handler.`,
    );
  }
  return fnFilePath;
};

const createFunctionFile = async (
  options: Required<Options>,
  fnId: string,
  fnFilePath: string,
) => {
  const fnFileRelative = path.join("functions", `${fnId}.js`);
  const fnBundledPath = path.join(options.outputDirectory, fnFileRelative);

  // We'll default to just using whatever Deno executable is on the path
  // Ideally we should be able to rely on Deno.execPath() so we make sure to bundle with the same version of Deno
  // that called this script. This is perhaps a bit overly cautious, so we can look to remove the defaulting here in the future.
  let denoExecutablePath = "deno";
  try {
    denoExecutablePath = Deno.execPath();
  } catch (e) {
    options.log("Error calling Deno.execPath()", e);
  }

  try {
    // call out to deno to handle bundling
    const p = Deno.run({
      cmd: [
        denoExecutablePath,
        "bundle",
        fnFilePath,
        fnBundledPath,
      ],
    });

    const status = await p.status();
    if (status.code !== 0 || !status.success) {
      throw new Error(`Error bundling function file: ${fnId}`);
    }

    options.log(`wrote function file: ${fnFileRelative}`);
  } catch (e) {
    options.log(`Error bundling function file: ${fnId}`);
    throw e;
  }
};
