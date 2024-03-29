import { validateAndCreateFunctions } from "../functions.ts";
import { assertEquals, assertExists, assertRejects } from "../dev_deps.ts";
import { Options } from "../types.ts";

Deno.test("validateAndCreateFunctions", () => {
  assertExists(validateAndCreateFunctions);
});

Deno.test("validateAndCreateFunctions should not throw an exception when fed a function file that has a default export", async () => {
  const captured_log: string[] = [];
  const options: Options = {
    manifestOnly: true,
    workingDirectory: Deno.cwd(),
    log: (x) => {
      captured_log.push(x);
    },
  };
  const manifest = {
    "functions": {
      "test_function": {
        "title": "Test function",
        "description": "this is a test",
        "source_file": "src/tests/functions/test_function_file.ts",
        "input_parameters": {
          "required": [],
          "properties": {},
        },
        "output_parameters": {
          "required": [],
          "properties": {},
        },
      },
    },
  };

  await validateAndCreateFunctions(
    options,
    manifest,
  );
  assertEquals("", captured_log.join(""));
});

Deno.test("Function files with no default export should get an error", async () => {
  const captured_log: string[] = [];
  const options: Options = {
    manifestOnly: true,
    workingDirectory: Deno.cwd(),
    log: (x) => {
      captured_log.push(x);
    },
  };
  const manifest = {
    "functions": {
      "test_function": {
        "title": "Test function",
        "description": "this is a test",
        "source_file": "src/tests/functions/test_function_no_export_file.ts",
        "input_parameters": {
          "required": [],
          "properties": {},
        },
        "output_parameters": {
          "required": [],
          "properties": {},
        },
      },
    },
  };
  await assertRejects(
    () => validateAndCreateFunctions(options, manifest),
    Error,
    "default export handler",
  );
});

Deno.test("Function files not exporting a function should get an error", async () => {
  const captured_log: string[] = [];
  const options: Options = {
    manifestOnly: true,
    workingDirectory: Deno.cwd(),
    log: (x) => {
      captured_log.push(x);
    },
  };
  const manifest = {
    "functions": {
      "test_function": {
        "title": "Test function",
        "description": "this is a test",
        "source_file": "src/tests/functions/test_function_not_function_file.ts",
        "input_parameters": {
          "required": [],
          "properties": {},
        },
        "output_parameters": {
          "required": [],
          "properties": {},
        },
      },
    },
  };
  await assertRejects(
    () => validateAndCreateFunctions(options, manifest),
    Error,
    "default export handler",
  );
});
