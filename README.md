# deno-slack-builder

Library for building a Run on Slack Deno project. The artifacts produced from this library are what can be deployed as a Run on Slack project.

The top level `mod.ts` file can be run as a Deno program. It takes up to 3 command line arguments:

* `--manifest` If passed, will only generate the manifest and skip building functions

* `--source` Absolute or relative path to your project. Defaults to current working directory.

* `--output` Where manifest and function files will be written to. Defaults to `dist`. If omitted with `--manifest` set the manifest will be printed to stdout.

```
deno run --unstable --allow-write --allow-read https://deno.land/x/deno_slack_builder@0.0.5/mod.ts"
```

1. Generates a `manifest.json` file in the `output` directory or prints to stdout.

2. Bundles any functions w/ Deno into the `output` directory in a structure compatible with the Run on Slack runtime.

## Manifest Generation Logic
Allows for flexibility with how you define your manifest.

* Looks for a `manifest.json` file. If it exists, use it.
* Looks for a `manifest.ts` file. If it exists, it's default export is used. If you also had a `manifest.json` file, it is deep-merged on top of the json file.
* If no `manifest.ts` exists, looks for a `manifest.js` file, and follows the same logic as `manifest.ts` does.

## Function Bundling
* For each entry in the `functions` where `remote_environment=slack` it looks for a `source_file` property, which should be a relative path to the corresponding function file. This is then bundled for the Run on Slack Deno runtime. The `reverse` function defined below indicates there should be a corresponding function file in the project located at `functions/reverse.ts`.

```json
"functions": {
  "reverse": {
    "title": "Reverse",
    "description": "Takes a string and reverses it",
    "source_file": "functions/reverse.ts",
    "input_parameters": {
      "required": [
        "stringToReverse"
      ],
      "properties": {
        "stringToReverse": {
          "type": "string",
          "description": "The string to reverse"
        }
      }
    },
    "output_parameters": {
      "required": [
        "reverseString"
      ],
      "properties": {
        "reverseString": {
          "type": "string",
          "description": "The string in reverse"
        }
      }
    }
  }
}
```