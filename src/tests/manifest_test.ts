import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { cleanManifest } from "../manifest.ts";

Deno.test("cleanManifest", () => {
  // Create a partial of a manifest w/ just a function
  const manifest = {
    "functions": {
      "reverse": {
        "title": "Reverse",
        "description": "Takes a string and reverses it",
        "source_file": "functions/reverse.ts",
        "input_parameters": {
          "required": [
            "stringToReverse",
          ],
          "properties": {
            "stringToReverse": {
              "type": "string",
              "description": "The string to reverse",
            },
          },
        },
        "output_parameters": {
          "required": [
            "reverseString",
          ],
          "properties": {
            "reverseString": {
              "type": "string",
              "description": "The string in reverse",
            },
          },
        },
      },
    },
  };

  const cleanedManifest = cleanManifest(manifest);

  assertEquals(cleanedManifest.functions.reverse.source_file, undefined);
});
