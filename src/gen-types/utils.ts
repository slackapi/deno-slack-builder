export const getCustomTypeId = (str: string) => str.split("/").slice(-1)[0];

export const isLocalTypeReference = (str: string) => str.startsWith("#/");

export const makeArrayType = (type: string) => `${type}[]`;

export const wrapAsTypeKey = (name: string, value: string, required = true) => {
  return `${name}${!required ? "?" : ""}: ${value}`;
};

export const wrapAsType = (key: string, value: string, exported?: boolean) => {
  return (exported ? `export ` : ``) + `type ${key} = ${value}`;
};
