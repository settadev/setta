import C from "constants/constants.json";
import { post } from "./utils";

export async function dbDocstringToMarkdown(docstring) {
  return await post({
    body: { docstring },
    address: C.ROUTE_DOCSTRING_TO_MARKDOWN,
  });
}
