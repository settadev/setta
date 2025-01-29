import { IconButton } from "components/Utils/atoms/buttons/IconButton";
import {
  TbArrowBigDownLinesFilled,
  TbArrowBigRightLinesFilled,
} from "react-icons/tb";
import { toggleSectionOrientation } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";

export function ChangeOrientationButton({ sectionId }) {
  const isHorizontalOrientation = useSectionInfos(
    (x) => x.x[sectionId].isHorizontalOrientation,
  );

  function onClick() {
    toggleSectionOrientation(sectionId);
  }

  return (
    <IconButton
      icon={
        !isHorizontalOrientation ? (
          <TbArrowBigDownLinesFilled />
        ) : (
          <TbArrowBigRightLinesFilled />
        )
      }
      color="text-setta-400 dark:text-setta-600 hover:text-setta-500 dark:hover:text-setta-400"
      bg="bg-transparent justify-content-center mr-1"
      size="w-4 h-4"
      padding="p-0"
      onClick={onClick}
    />
  );
}
