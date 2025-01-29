import { useEffect, useRef } from "react";
import { deleteSectionRef, setSectionRef } from "state/actions/sectionRefs";

export function useSectionRefAndInit(sectionId, type) {
  const ref = useRef(null);

  useEffect(() => {
    setSectionRef({ sectionId, [type]: ref.current });
    return () => deleteSectionRef({ sectionId });
  }, []);

  return ref;
}
