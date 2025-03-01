import { MdDeveloperMode, MdEdit, MdPersonOutline } from "react-icons/md";
import { useSectionInfos } from "state/definitions";
import { VIEWING_EDITING_MODE } from "utils/constants";

export function ViewingEditingMode({}) {
  const selectedMode = useSectionInfos(
    (x) => x.projectConfig.viewingEditingMode,
  );

  const modes = [
    {
      id: VIEWING_EDITING_MODE.DEV,
      label: "Developer View",
      icon: <MdDeveloperMode size={20} />,
    },
    {
      id: VIEWING_EDITING_MODE.USER,
      label: "User View",
      icon: <MdPersonOutline size={20} />,
    },
    {
      id: VIEWING_EDITING_MODE.USER_EDIT,
      label: "Edit User View",
      icon: <MdEdit size={20} />,
    },
  ];

  const handleModeChange = (modeId) => {
    useSectionInfos.setState((state) => {
      state.projectConfig.viewingEditingMode = modeId;
    });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {modes.map((mode) => (
        <button
          key={mode.id}
          className={`
                        flex flex-col items-center justify-center rounded p-2 transition-all
                        ${
                          selectedMode === mode.id
                            ? "bg-white text-blue-600 shadow-sm dark:bg-setta-800"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-setta-800/50"
                        }
                    `}
          onClick={() => handleModeChange(mode.id)}
          title={mode.label}
        >
          <span
            className={`flex items-center justify-center ${selectedMode === mode.id ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
          >
            {mode.icon}
          </span>
          <span className="mt-1 text-center text-[9px] leading-tight">
            {mode.label}
          </span>
        </button>
      ))}
    </div>
  );
}
