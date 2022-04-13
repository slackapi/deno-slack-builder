import { SchemaTypes } from "../deps.ts";

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
