const DENO_SLACK_SDK = "deno_slack_sdk";
const DENO_SLACK_API = "deno_slack_api";
// TODO: if we can assume that the `get-scripts` hook will be in place in time for this code to be used, then
// we can remove checking for deno_slack_runtime (as builder will encode a specific runtime version)
const DENO_SLACK_RUNTIME = "deno_slack_runtime";
const DENO_SLACK_BUILDER = "deno_slack_builder";
const ALL_SDKS = [
  DENO_SLACK_SDK,
  DENO_SLACK_API,
  DENO_SLACK_RUNTIME,
  DENO_SLACK_BUILDER,
];

export const checkForSdkUpdates = async () => {
  const cwd = Deno.cwd();
  // Holds the current version detected of each SDK in the current project
  // deno-lint-ignore no-explicit-any
  const versionMap: any = {};
  ALL_SDKS.forEach((sdk) => {
    versionMap[sdk] = null;
  });
  // Array depicting whether each detected SDK is out of date or not
  const sdksOutOfDate = [];
  // Human-readable message to return to the CLI
  const message = [];

  // Find the SDK and/or API Client versions in import map, if available
  const map = await getJson(`${cwd}/import_map.json`);
  let value: string;
  for (value of Object.values(map.imports) as string[]) {
    if (value.includes(DENO_SLACK_SDK)) {
      versionMap[DENO_SLACK_SDK] = extractVersion(value);
    }
    if (value.includes(DENO_SLACK_API)) {
      versionMap[DENO_SLACK_API] = extractVersion(value);
    }
  }

  // Find builder and/or runtime versions in slack.json, if available
  const slack = await getJson(`${cwd}/.slack/slack.json`);
  // deno-lint-ignore no-explicit-any
  let hook: any;
  for (hook of Object.values(slack)) {
    const command = hook.script?.default;
    if (command) {
      // TODO: does not cover the case where multiple commands use the same SDK; only the "last" key containing
      // the relevant SDK will be checked as-is
      if (command.includes(DENO_SLACK_BUILDER)) {
        versionMap[DENO_SLACK_BUILDER] = extractVersion(command);
      }
      if (command.includes(DENO_SLACK_RUNTIME)) {
        versionMap[DENO_SLACK_RUNTIME] = extractVersion(command);
      }
    }
  }

  // Compare current to latest versions of the various SDKs we were able to find
  for (const sdk of ALL_SDKS) {
    const current = versionMap[sdk];
    if (current) {
      const latest = await fetchLatestModuleVersion(sdk);
      const outOfDate = current != latest;
      sdksOutOfDate.push(outOfDate);
      if (outOfDate) {
        message.push(
          `${sdk} is out of date! Latest available version: ${latest}, current version: ${current}.`,
        );
      } else {
        message.push(
          `${sdk} is up to date! Latest available version: ${latest}.`,
        );
      }
    }
  }
  return {
    update: sdksOutOfDate.reduce((acc, cur) => acc || cur, false),
    message: message, //.join("\n")
  };
};

async function getJson(file: string) {
  return JSON.parse(await Deno.readTextFile(file));
}

async function fetchLatestModuleVersion(moduleName: string) {
  const res = await fetch(`https://deno.land/x/${moduleName}`, {
    redirect: "manual",
  });
  const redirect = res.headers.get("location");
  if (redirect === null) {
    throw new Error(`${moduleName} not found on deno.land!`);
  }
  return extractVersion(redirect);
}

function extractVersion(str: string) {
  const at = str.indexOf("@");
  const slash = str.indexOf("/", at);
  return str.substring(at + 1, slash);
}

console.log(JSON.stringify(await checkForSdkUpdates(), null, 2));
