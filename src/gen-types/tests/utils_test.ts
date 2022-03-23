import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import {
  getCustomTypeId,
  isLocalTypeReference,
  makeArrayType,
  wrapAsType,
  wrapAsTypeKey,
} from "../utils.ts";

Deno.test("getCustomTypeId returns the type callback", () => {
  assertEquals(getCustomTypeId("#/types/test"), "test");
  assertEquals(getCustomTypeId("#/types/another_one"), "another_one");
  assertEquals(getCustomTypeId("#/types/anotherOne"), "anotherOne");
});

Deno.test("isLocalTypeReference is able to identify references to local custom types", () => {
  assertEquals(isLocalTypeReference("#/types/test"), true);
  assertEquals(isLocalTypeReference("string"), false);
});

Deno.test("makeArrayType appropriately converts an existing type to an array type", () => {
  assertEquals(
    makeArrayType(wrapAsType("test", "string")),
    "type test = string[]",
  );
});

Deno.test("wrapAsType successfully converts a key and value into a type", () => {
  assertEquals(wrapAsType("test", "string"), "type test = string");
});

Deno.test("wrapAsType appropriately handles exporting types", () => {
  assertEquals(wrapAsType("test", "string", false), "type test = string");
  assertEquals(wrapAsType("test", "string", true), "export type test = string");
});

Deno.test("wrapAsTypeKey successfully converts a key and value into an object property type", () => {
  assertEquals(wrapAsTypeKey("test", "string", true), "test: string");
});
Deno.test("wrapAsTypeKey successfully marks keys optional", () => {
  assertEquals(wrapAsTypeKey("test", "string", false), "test?: string");
});

Deno.test("Type objects can be created by using wrapAsType and wrapAsTypeKey together", () => {
  assertEquals(
    wrapAsType("test", `{${wrapAsTypeKey("test", "string")}}`),
    "type test = {test: string}",
  );
});
