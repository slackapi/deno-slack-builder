# deno-slack-builder

⚠️ This repository is now archived. It has been superseded by https://github.com/slackapi-deno-slack-hooks.

Library for building a Run on Slack Deno project. The artifacts produced from this library are what can be deployed as a Run on Slack project.

## Requirements

A recent version of `deno`.

## Quickstart

_**Note:** The examples below use version `0.1.0` of `deno-slack-builder`; check the [Releases](https://github.com/slackapi/deno-slack-builder/releases) page and be sure to use the latest version._

In a directory that contains a valid manifest file (`manifest.json`, `manifest.js`, or `manifest.ts`), run the following:

```bash
deno run --allow-write --allow-read "https://deno.land/x/deno_slack_builder@0.1.0/mod.ts"
```

This will generate a valid Run On Slack project in a new folder named `dist`.

## Usage details

The top level `mod.ts` file is executed as a Deno program, and takes up to three optional arguments:

| Optional Argument | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `--manifest`      | If passed, will only generate the manifest and skip building functions. |
| `--source`        | Absolute or relative path to your project. Defaults to current working directory. |
| `--output`        | Where manifest and function files will be written to. Defaults to `dist`. If omitted and `--manifest` is set, the manifest will be printed to stdout. |

### Example Usage

**Only generate a valid Run On Slack manifest file:**

```bash
deno run --allow-write --allow-read "https://deno.land/x/deno_slack_builder@0.1.0/mod.ts" --manifest
```

**Generate a Run On Slack project from a /src directory:**

```bash
deno run --allow-write --allow-read "https://deno.land/x/deno_slack_builder@0.1.0/mod.ts" --source src
```

## How it works

This Deno program bundles any functions with Deno into the output directory in a structure compatible with the Run on Slack runtime, and generates a Run On Slack `manifest.json` file.

Both the manifest and the functions will be placed into a `dist` directory by default; use `--output` to specify a different target directory. You can also output to stdout by using `--manifest` (be sure to not use `--output` if you want to write to stdout).

### Manifest Generation Logic

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
      "properties": {
        "stringToReverse": {
          "type": "string",
          "description": "The string to reverse"
        }
      },
      "required": ["stringToReverse"]
    },
    "output_parameters": {
      "properties": {
        "reverseString": {
          "type": "string",
          "description": "The string in reverse"
        }
      },
      "required": ["reverseString"]
    }
  }
}
```

## Running Tests

If you make changes to this repo, or just want to make sure things are working as desired, you can run:

```bash
deno task test
```

To get a full test coverage report, run:

```bash
deno task coverage
```

---

### Getting Help

We welcome contributions from everyone! Please check out our
[Contributor's Guide](.github/CONTRIBUTING.md) for how to contribute in a
helpful and collaborative way.
