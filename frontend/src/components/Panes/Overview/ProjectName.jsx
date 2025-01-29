import { Editable } from "components/Utils/Editable";
import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import { useNavigate } from "react-router-dom";
import { dbSetProjectConfigName } from "requests/projectName";
import { useProjectConfig } from "state/definitions";
import { useEditableOnSubmit } from "state/hooks/editableText";
import { PAGE_LOAD_TYPES, pathRelativeToProject } from "utils/constants";

const editing =
  "flex-1 box-border [border-width:0_0_1px_0] border-solid bg-transparent focus:border-blue-300 focus-visible:ring-0 focus-visible:outline-none w-full ";

const notEditing =
  "flex-1 box-border border-b border-solid border-transparent bg-transparent focus-visible:border-blue-300 focus-visible:ring-0 focus-visible:outline-none w-full truncate";

export function ProjectName() {
  return (
    <header
      className="mb-2 flex w-full flex-col flex-wrap   tracking-tight "
      {...getFloatingBoxHandlers({
        content:
          "Your Project's Name and Config Name, editable all in one spot!",
      })}
    >
      <ProjectNameOnly />
    </header>
  );
}

function ProjectNameOnly() {
  const [localName, onChange, onBlur, onKeyDown, blurTriggeredByEscapeKey] =
    useEditableProjectName();

  return (
    <Editable
      titleProps={{
        editing: `${editing} text-xl text-setta-900 dark:text-setta-50 font-bold `,
        notEditing: `${notEditing} text-xl text-setta-900 dark:text-setta-50 font-bold `,
      }}
      value={localName}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      blurTriggeredByEscapeKey={blurTriggeredByEscapeKey}
    />
  );
}

function useEditableProjectName() {
  const name = useProjectConfig((x) => x.name);
  const navigate = useNavigate();
  async function condition(v) {
    const res = await dbSetProjectConfigName(v);
    return res.status === 200;
  }
  async function onSetName(v) {
    navigate(pathRelativeToProject(v), {
      state: { pageLoadType: PAGE_LOAD_TYPES.CHANGE_PROJECT_CONFIG_NAME },
    });
  }

  return useEditableOnSubmit(name, onSetName, condition);
}
