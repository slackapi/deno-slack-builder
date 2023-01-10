import { cleanManifest, createManifest } from "./manifest.ts";
import { validateAndCreateFunctions } from "./functions.ts";
import { Options } from "./types.ts";
import { parse, path } from "./deps.ts";

const run = async () => {
  const start = Date.now();
  // We could add additional arguments to indicate things like only generate the manifest, or only functions
  let { source, output, manifest: manifestOnly = false } = parse(Deno.args);

  // If we're generating functions, default output to a relative dist folder
  if (!output && !manifestOnly) {
    output = "dist";
  }

  const outputDirectory = output
    ? (path.isAbsolute(output) ? output : path.join(Deno.cwd(), output || ""))
    : undefined;
  const workingDirectory = path.isAbsolute(source || "")
    ? source
    : path.join(Deno.cwd(), source || "");

  const options: Options = {
    manifestOnly,
    workingDirectory,
    outputDirectory,
    // deno-lint-ignore no-explicit-any
    log: (...args: any) => console.log(...args),
  };

  // Disable logging to stdout if we're outputing a manifest.json file to stdout
  if (options.manifestOnly) {
    options.log = () => {};
  }

  options.log(options);

  // Clean output directory
  if (options.outputDirectory) {
    const removedDirectory = await removeDirectory(options.outputDirectory);
    if (removedDirectory) {
      options.log(`remove directory: ${options.outputDirectory}`);
    }
  }

  // Generate Manifest
  const generatedManifest = await createManifest(options);

  await validateAndCreateFunctions(options, generatedManifest);

  const prunedManifest = cleanManifest(generatedManifest);
  //console.log(JSON.stringify(prunedManifest, null, 2));

  // If no output was provided, print to stdout
  if (!options.outputDirectory) {
    // We explicitly are writing this to stdout here, not using log()
    console.log(JSON.stringify(prunedManifest, null, 2));
  } else {
    await Deno.writeTextFile(
      path.join(options.outputDirectory, "manifest.json"),
      JSON.stringify(prunedManifest, null, 2),
    );
    options.log(`wrote manifest.json`);
  }

  const duration = Date.now() - start;
  options.log(`duration: ${duration}ms`);
};

/**
 * Recursively deletes the specified directory.
 *
 * @param directoryPath the directory to delete
 * @returns true when the directory is deleted or throws unexpected errors
 */
async function removeDirectory(directoryPath: string): Promise<boolean> {
  try {
    await Deno.remove(directoryPath, { recursive: true });
    return true;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }

    throw err;
  }
}

run();
