import { cleanManifest, createManifest } from "./manifest.ts";
import { validateAndCreateFunctions } from "./functions.ts";
import type { Options, Protocol } from "./types.ts";
import { parse, path } from "./deps.ts";
import { getProtocolInterface } from "./protocol.ts";

const run = async (walkieTalkie: Protocol) => {
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
  };

  walkieTalkie.log(options);

  // Clean output directory
  if (options.outputDirectory) {
    const removedDirectory = await removeDirectory(options.outputDirectory);
    if (removedDirectory) {
      walkieTalkie.log(`remove directory: ${options.outputDirectory}`);
    }
  }

  // Generate Manifest
  const generatedManifest = await createManifest(options);

  await validateAndCreateFunctions(options, walkieTalkie, generatedManifest);

  const prunedManifest = cleanManifest(generatedManifest);

  // If no output directory was provided, we assume the CLI is asking for the app's manifest
  if (!options.outputDirectory) {
    // We explicitly are writing this to stdout here, not using log()
    walkieTalkie.respond(JSON.stringify(prunedManifest, null, 2));
  } else {
    await Deno.writeTextFile(
      path.join(options.outputDirectory, "manifest.json"),
      JSON.stringify(prunedManifest, null, 2),
    );
    walkieTalkie.log(`wrote manifest.json`);
  }

  const duration = Date.now() - start;
  walkieTalkie.log(`duration: ${duration}ms`);
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

if (import.meta.main) {
  const walkieTalkie = getProtocolInterface(Deno.args);
  run(walkieTalkie);
}
