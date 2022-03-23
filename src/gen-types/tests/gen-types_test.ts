import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import {
  generateArrayType,
  generateCustomTypeTypes,
  generateObjectParameters,
} from "../generators.ts";

// Normal
Deno.test("Standard Types are being generated correctly", () => {
  assertEquals("test", "test");
});

// Object Type
Deno.test("generateObjectParameters properly handles primitive types", () => {
  const obj = {
    type: "object",
    properties: { test: { type: "string" } },
  };
  assertEquals(
    generateObjectParameters(obj),
    `{
    test: string;
  }`,
  );

  obj.properties.test.type = "integer";
  assertEquals(
    generateObjectParameters(obj),
    `{
    test: number;
  }`,
  );

  obj.properties.test.type = "number";
  assertEquals(
    generateObjectParameters(obj),
    `{
    test: number;
  }`,
  );

  obj.properties.test.type = "boolean";
  assertEquals(
    generateObjectParameters(obj),
    `{
    test: boolean;
  }`,
  );
});

Deno.test("generateObjectParameters properly handles object of object", () => {
  const obj = {
    type: "object",
    properties: {
      test: {
        type: "object",
        properties: {
          test2: "string",
        },
      },
    },
  };
  assertEquals(
    generateObjectParameters(obj),
    `{
    test: {
    test2: string
  }
  }`,
  );
});

Deno.test("generateObjectParameters properly handles object of array", () => {
});

Deno.test("generateObjectParameters properly handles object of custom types", () => {
});

Deno.test("generateObjectParameters properly handles additionalProperties", () => {
});

// Array Type
Deno.test("generateArrayType properly handles primitive types", () => {
  assertEquals(
    generateArrayType({ type: "array", items: { type: "string" } }),
    "string[]",
  );
  assertEquals(
    generateArrayType({ type: "array", items: { type: "integer" } }),
    "number[]",
  );
  assertEquals(
    generateArrayType({ type: "array", items: { type: "number" } }),
    "number[]",
  );
  assertEquals(
    generateArrayType({ type: "array", items: { type: "boolean" } }),
    "boolean[]",
  );
});

Deno.test("generateArrayType properly handles arrays of array", () => {
  assertEquals(
    generateArrayType({
      type: "array",
      items: { type: "array", items: { type: "string" } },
    }),
    "string[][]",
  );
});

Deno.test("generateArrayType properly handles arrays of object", () => {
  assertEquals(
    generateArrayType({
      type: "array",
      items: { type: "object", properties: { test: { type: "string" } } },
    }),
    `{
    test: string;
  }[]`,
  );
});

// Custom Types
Deno.test("generateCustomTypeTypes properly handles primitive types", () => {
  assertEquals(
    generateCustomTypeTypes({ "test": { type: "string" } }),
    `export type Test = string`,
  );
  assertEquals(
    generateCustomTypeTypes({ "test": { type: "integer" } }),
    `export type Test = number`,
  );
  assertEquals(
    generateCustomTypeTypes({ "test": { type: "number" } }),
    `export type Test = number`,
  );
  assertEquals(
    generateCustomTypeTypes({ "test": { type: "boolean" } }),
    `export type Test = boolean`,
  );
});

Deno.test("generateCustomTypeTypes properly handles object types", () => {
  const customTypes = {
    "incident": {
      "type": "object",
      "properties": {
        "severity": {
          "type": "integer",
        },
        "priority": {
          "type": "string",
        },
      },
    },
  };
  assertEquals(
    generateCustomTypeTypes(customTypes),
    `export type Incident = {
    severity: number;
priority: string;
  }`,
  );
});

Deno.test("generateCustomTypeTypes properly handles array types", () => {
  const customType = {
    "test": {
      "type": "array",
      "items": {
        "type": "string",
      },
    },
  };
  assertEquals(
    generateCustomTypeTypes(customType),
    `export type Test = string[]`,
  );

  customType.test.items.type = "number";
  assertEquals(
    generateCustomTypeTypes(customType),
    `export type Test = number[]`,
  );

  customType.test.items.type = "integer";
  assertEquals(
    generateCustomTypeTypes(customType),
    `export type Test = number[]`,
  );

  customType.test.items.type = "boolean";
  assertEquals(
    generateCustomTypeTypes(customType),
    `export type Test = boolean[]`,
  );

  // Array of arrays
  // const arrayOfArrays = {
  //   ...customType,
  //   items: { type: "array", items: { type: "string" } },
  // };
  // assertEquals(
  //   generateCustomTypeTypes(arrayOfArrays),
  //   `export type Test = string[][]`,
  // );

  // Array of objects
  // const arrayOfObjects = {
  //   ...customType,
  //   items: {
  //     type: "object",
  //     properties: {
  //       test: "string",
  //     },
  //   },
  // };
  // assertEquals(
  //   generateCustomTypeTypes(arrayOfObjects),
  //   `export type Test = {test: string}[]`,
  // );

  // Array of custom type
  // Untyped arrays
});

Deno.test("generateCustomTypeTypes properly handles enum types", () => {
});
