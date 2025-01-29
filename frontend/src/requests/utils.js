import axios from "axios";
import { URLS } from "utils/constants";

export async function post({ address, body }) {
  return axios
    .post(`${URLS.BACKEND}${address}`, body, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => res)
    .catch((res) => res);
}

export function pseudoTemplatedStr(inputStr, replacements) {
  let output = inputStr;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{${key}\\}`, "g"); // Creates a global regex
    output = output.replace(regex, value);
  }
  return output;
}
