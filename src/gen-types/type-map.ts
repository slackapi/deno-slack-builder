import SchemaTypes from "https://deno.land/x/deno_slack_sdk@0.0.1/schema/schema_types.ts";

interface TypeMap {
  [key: string]: string;
}

export const TypeMap: TypeMap = {
  [SchemaTypes.boolean]: "boolean",
  [SchemaTypes.integer]: "number",
  [SchemaTypes.number]: "number",
  [SchemaTypes.string]: "string",
  any: "any",
};
