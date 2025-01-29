import C from "constants/constants.json";
import { post } from "./utils";

export async function dbCreateCopyOfSections(sectionsAndOtherInfo) {
  return await post({
    body: { sectionsAndOtherInfo },
    address: C.ROUTE_COPY_SECTIONS,
  });
}
