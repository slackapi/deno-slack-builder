import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import {
  ManifestFunctionSchema,
  ManifestSchema,
} from "https://deno.land/x/deno_slack_sdk@0.0.1/types.ts";
import { createManifest } from "../manifest.ts";
import { convertSnakeToPascal } from "../utils.ts";
import { CUSTOM_TYPE_FILENAME, DEFAULT_DIRECTORY } from "./constants.ts";
import {
  generateCustomTypeTypes,
  generateFunctionTypes,
  generateTypeImport,
} from "./generators.ts";
import { wrapAsType } from "./utils.ts";

// TODO: Handle enum

const start = Date.now();

const { source, output: outputDir = DEFAULT_DIRECTORY } = parse(Deno.args);

try {
  Deno.removeSync(outputDir, { recursive: true });
} catch (_e) {
  // This will fail if the directory is already missing, but that's fine
  console.log("generated directory not found, creating...");
}
Deno.mkdirSync(outputDir);

/*
START TODO:
* Consider if this is necessary or if we can instead rely on a built manifest.json
* Clean up duplication in createManifest
- outputDirectory is unnecessary
- log is unnecessary
*/
const workingDirectory = path.isAbsolute(source || "")
  ? source
  : path.join(Deno.cwd(), source || "");

// JSON.parse(JSON.stringify) forces all features to be exported
const manifestPayload: ManifestSchema = JSON.parse(JSON.stringify(
  await createManifest({
    manifestOnly: true,
    outputDirectory: undefined,
    workingDirectory,
    // deno-lint-ignore no-explicit-any
    log: (...args: any) => console.log(...args),
  }),
));

/* END TODO */

const CODEGEN_HEADER = `/**
 * These types have been generated automatically from your manifest.json file, do not edit manually.
 * Run the CLI command to regenerate these types to reflect any changes to that file.
 **/
`;

const createFunctionTypeFile = (key: string, func: ManifestFunctionSchema) => {
  const functionName = convertSnakeToPascal(key);

  const imports = [
    `import type { FunctionHandler } from "deno-slack-sdk/types.ts"`,
    ...generateTypeImport(func.input_parameters.properties),
  ];
  const functionInputType = wrapAsType(
    `${functionName}FunctionInputs`,
    `{${generateFunctionTypes(func.input_parameters)}}`,
  );
  const functionOutputType = wrapAsType(
    `${functionName}FunctionOutputs`,
    `{${generateFunctionTypes(func.output_parameters)}}`,
  );

  const functionHandlerType = wrapAsType(
    `${functionName}FunctionHandler`,
    `FunctionHandler<${functionName}FunctionInputs, ${functionName}FunctionOutputs>`,
    true,
  );

  return `
  ${CODEGEN_HEADER}
  ${imports.join("\n")}
  
  ${functionInputType}

  ${functionOutputType}
  
  ${functionHandlerType}
  `;
};

// Create a file containing all Custom Types from the Manifest
console.log(
  `Generating custom type file: ${outputDir}/${CUSTOM_TYPE_FILENAME}.ts`,
);
await Deno.writeTextFile(
  `${outputDir}/${CUSTOM_TYPE_FILENAME}.ts`,
  `
  ${CODEGEN_HEADER}

  ${generateCustomTypeTypes(manifestPayload.types)}
  `,
);

// Create a separate type file for each function
for (const [key, func] of Object.entries(manifestPayload.functions ?? {})) {
  console.log(`Generating function type file: ${outputDir}/${key}.ts`);
  await Deno.writeTextFile(
    `${outputDir}/${key}.ts`,
    createFunctionTypeFile(key, func),
  );
}

const duration = Date.now() - start;
console.log(`duration: ${duration}ms`);
