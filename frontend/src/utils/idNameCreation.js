import {
  adjectives,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";

export function createNewId() {
  return uuidv4();
}

export function maybeNewId(x) {
  return x ? x : createNewId();
}

export function createVarName(existingVarNames) {
  const customConfig = {
    dictionaries: [adjectives, colors],
    separator: "_",
    length: 2,
  };

  let varName;
  while (!varName || existingVarNames.includes(varName)) {
    varName = uniqueNamesGenerator(customConfig);
  }

  return varName;
}

export function createRandomName() {
  const customConfig = {
    dictionaries: [adjectives, colors],
    separator: "_",
    length: 2,
  };

  return uniqueNamesGenerator(customConfig);
}
