// TODO: Do we still need this abort? If so it should be more helpful
export const abort = () => {
  throw new Error("Something terrible has happened");
};

export const capitalizeStr = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const convertSnakeToPascal = (str: string) => {
  if (str.includes("_")) {
    return str.split("_").map((chunk) => capitalizeStr(chunk)).join("");
  }
  return capitalizeStr(str);
};
