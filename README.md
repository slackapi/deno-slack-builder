# deno-slack-builder

Library for building a Run on Slack Deno project. The artifacts produced from this library are what can be deployed as a Run on Slack project.

The top level `mod.ts` file can be run as a Deno program. It takes up to 3 command line arguments:

* `--source="/path/to/project/"` Defaults to the current working directory
* `--output="/path/to/build/artifacts/"` Optional if `--manifest` is set. Will print to stdout out if omitted
* `--manifest` Will only generate the manifest.json file

```
deno run -q --unstable --allow-write --allow-read ./src/mod.ts --source="samples/a" --output="dist/a"
```


The `source` path will be used for where the builder will look for relevant files. The `output` path is where ouput files will be written.


1. Generates a `manifest.json` file in the `output` directory.

2. Bundles any functions with `remote_environment=slack` w/ Deno into the `output` directory in a structure our runtime layer expects.

## Manifest Generation
Allows for flexibility with how you define your manifest.

* Looks for a `manifest.json` file. If it exists, use it.
* Looks for a `manifest.ts` file. If it exists, it's default export is used. If you also had a `manifest.json` file, it is deep-merged on top of the json file.
* If no `manifest.ts` exists, looks for a `manifest.js` file, and follows the same logic as `manifest.ts` does.

## Function Bundling
* For each entry in the `functions` where `remote_environment=slack` it looks for a `source_file` property, which should be a relative path to the corresponding function file. This is then bundled for the Run on Slack Deno runtime.