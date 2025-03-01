import { IconButton } from "components/Utils/atoms/buttons/IconButton";
import { BiHide, BiShow } from "react-icons/bi";
import { deleteSections } from "state/actions/sections/deleteSections";
import { maybeIncrementProjectStateVersion } from "state/actions/undo";
import { useSectionInfos } from "state/definitions";
import { VIEWING_EDITING_MODE } from "utils/constants";

// absolute top-1 right-1
export function DeleteOrHideButton({
  sectionId,
  viewingEditingMode,
  ...props
}) {
  const visibility = useSectionInfos((x) => {
    let key = viewingEditingMode;
    if (key === VIEWING_EDITING_MODE.USER_EDIT) {
      key = VIEWING_EDITING_MODE.USER;
    }
    return x.x[sectionId].visibility[key];
  });

  const onClick = () => {
    useSectionInfos.setState((state) => {
      if (viewingEditingMode === VIEWING_EDITING_MODE.DEV) {
        deleteSections([sectionId], state);
      } else if (viewingEditingMode === VIEWING_EDITING_MODE.USER_EDIT) {
        state.x[sectionId].visibility[VIEWING_EDITING_MODE.USER] = !visibility;
      }
    });

    maybeIncrementProjectStateVersion(true);
  };

  return (
    <IconButton
      {...props}
      icon={getIcon(viewingEditingMode, visibility)}
      color="text-setta-600 hover:text-white"
      bg="bg-transparent hover:bg-red-500"
      size="min-w-4 h-4"
      padding="p-0"
      // twClasses={twClasses}
      onClick={onClick}
    />
  );
  // return <button onClick={onClick} className="gg-close" />;
}

function getIcon(viewingEditingMode, visibility) {
  switch (viewingEditingMode) {
    case VIEWING_EDITING_MODE.DEV:
      return <i className="gg-close" />;
    case VIEWING_EDITING_MODE.USER_EDIT:
      return visibility ? <BiShow /> : <BiHide />;
  }
}
