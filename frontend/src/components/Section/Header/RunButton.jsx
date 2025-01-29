import { IconButton } from "components/Utils/atoms/buttons/IconButton";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { RiPlayMiniFill } from "react-icons/ri";
import { importCodeBlocks, runCodeBlocks } from "state/actions/runOrImportCode";
import { getSectionInfo } from "state/actions/sectionInfos";

export function RunButton({ sectionId }) {
  function onClick() {
    const { runInMemory } = getSectionInfo(sectionId);
    if (runInMemory) {
      importCodeBlocks([sectionId]);
    } else {
      runCodeBlocks([sectionId]);
    }
  }

  return (
    <IconButton
      icon={<RiPlayMiniFill />}
      color="text-setta-600 hover:text-green-500  active:!text-blue-700"
      bg="bg-transparent"
      size="w-4 h-4"
      padding="p-0 mr-1"
      onClick={onClick}
      {...getFloatingBoxHandlers({ title: "Run this code block" })}
    />
  );
}
