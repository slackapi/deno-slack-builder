import { ParameterSetDefinition } from "https://deno.land/x/deno_slack_sdk@0.0.1/parameters/mod.ts";
import {
  TypedArrayParameterDefinition,
  TypedParameterDefinition,
} from "https://deno.land/x/deno_slack_sdk@0.0.1/parameters/types.ts";
import SchemaTypes from "https://deno.land/x/deno_slack_sdk@0.0.1/schema/schema_types.ts";
import { ManifestFunctionParameters } from "https://deno.land/x/deno_slack_sdk@0.0.1/types.ts";
import { abort, capitalizeStr, convertSnakeToPascal } from "../utils.ts";
import { CUSTOM_TYPE_FILENAME } from "./constants.ts";
import { TypeMap } from "./type-map.ts";
import {
  getCustomTypeId,
  isLocalTypeReference,
  makeArrayType,
  wrapAsType,
  wrapAsTypeKey,
} from "./utils.ts";

// TODO: These are very finicky with whitespace, which is solved by `deno fmt` but we should likely fix

export const generateObjectParameters = (
  definition: TypedParameterDefinition,
): string => {
  const properties = [];
  if ("properties" in definition) {
    properties.push(...Object.entries(definition?.properties ?? {}));
    if (definition.additionalProperties) {
      // TODO: This feels a bit hacky, consider another way
      properties.push(["// deno-lint-ignore no-explicit-any"]);
      properties.push(["[key:string]", { type: "any" }]);
    }
  }

  return `{
    ${
    properties.map(([k, v]) => {
      if (!v) return k; // Hack to allow linting
      if (v instanceof Object) {
        if (v.type === SchemaTypes.object) {
          return `${k}: ${generateObjectParameters(v)}`;
        } else if (v.type === SchemaTypes.array) {
        } else if (v.type) {
          // TODO: Why can't we use wrapAsTypeKey here?
          return `${k}: ${(TypeMap)[v.type as string]};`;
        }
      }
      return wrapAsTypeKey(k as string, v as string);
    }).join("\n")
  }
  }`;
};

// TODO: Consider renaming as this isn't generating the entire type
export const generateArrayType = (
  definition: TypedArrayParameterDefinition,
): string => {
  // TODO: Do we need to support Untyped Array Parameters?
  // Appease type-checker
  if (definition.items.type instanceof Object) abort();
  else if (definition.items.type === SchemaTypes.array) {
    return makeArrayType(generateArrayType(
      definition.items as TypedArrayParameterDefinition,
    ));
  } else if (definition.items.type === SchemaTypes.object) {
    return makeArrayType(generateObjectParameters(definition.items));
  } else if (isLocalTypeReference(definition.items.type)) {
    const id = convertSnakeToPascal(getCustomTypeId(definition.items.type));
    return makeArrayType(id);
  } else if (TypeMap[definition.items.type]) {
    return makeArrayType(TypeMap[definition.items.type]);
  }
  // TODO: Figure out how to handle Slack types
  return "unknown";
};

export const generateFunctionTypes = (
  parameters: ManifestFunctionParameters,
) => {
  const requiredFields = Object.values(parameters.required ?? {});
  return Object.entries(parameters?.properties || [])
    .map(([key, value]) => {
      const isRequired = requiredFields.includes(key);
      // Appease type checker
      if (value.type instanceof Object) abort();
      else if (value.type === SchemaTypes.object) {
        return wrapAsTypeKey(key, generateObjectParameters(value), isRequired);
      } else if (value.type === SchemaTypes.array) {
        return wrapAsTypeKey(
          key,
          generateArrayType(value as TypedArrayParameterDefinition),
          isRequired,
        );
      } else if (TypeMap[value.type]) {
        return wrapAsTypeKey(key, (TypeMap)[value.type], isRequired);
      } else if (isLocalTypeReference(value.type)) {
        const id = getCustomTypeId(value.type);
        return wrapAsTypeKey(key, convertSnakeToPascal(id), isRequired);
      } else {
        // TODO: Figure out how to handle slack types
        // For now we treat them all as strings
        return wrapAsTypeKey(key, "string", isRequired);
      }
    })
    .join("\n");
};

export const generateCustomTypeTypes = (types?: ParameterSetDefinition) => {
  return Object.entries(types ?? {})
    .map(([key, value]) => {
      const formattedKey = convertSnakeToPascal(key);
      if (value.type instanceof Object) {
        // Appease type-checker
        abort();
        return;
      } else if (value.type === SchemaTypes.array && "items" in value) {
        console.log(formattedKey, value);
        return wrapAsType(formattedKey, generateArrayType(value), true);
      } else if (value.type === SchemaTypes.object) {
        return wrapAsType(formattedKey, generateObjectParameters(value), true);
      } else if (isLocalTypeReference(value.type)) {
        // TODO: Handle Custom Types referencing other Custom Types
        // This is a custom type, for now we panic!
        throw new Error("Custom Type referencing a Custom Type");
      }
      return wrapAsType(formattedKey, (TypeMap)[value.type], true);
    }).join("\n\n");
};

export const generateTypeImport = (properties: ParameterSetDefinition) => {
  return Object.entries(properties).filter(([_key, value]) => {
    if (value.type instanceof Object) return false;
    return isLocalTypeReference(value.type ?? {});
  }).map(([key, _value]) => {
    return `import type { ${
      capitalizeStr(key)
    } } from "./${CUSTOM_TYPE_FILENAME}.ts"`;
  });
};
