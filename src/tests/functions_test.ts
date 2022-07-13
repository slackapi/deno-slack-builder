import { validateAndCreateFunctions } from "../functions.ts";
import { assertExists } from "../dev_deps.ts";

Deno.test("validateAndCreateFunctions", () => {
  assertExists(validateAndCreateFunctions);
});
