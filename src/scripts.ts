export const projectScripts = () => {
  return {
    "manifest": {
      "script": {
        "default":
          "deno run -q --unstable --import-map=import_map.json --allow-read --allow-net https://deno.land/x/deno_slack_builder@0.0.5/mod.ts --manifest",
      },
    },
    "package": {
      "script": {
        "default":
          "deno run -q --unstable --import-map=import_map.json --allow-read --allow-write --allow-net https://deno.land/x/deno_slack_builder@0.0.5/mod.ts",
      },
    },
    "run": {
      "script": {
        "default":
          "deno run -q --unstable --allow-write --allow-read --allow-net https://deno.land/x/deno_slack_runtime@0.0.2/mod.ts",
      },
    },
  };
};
