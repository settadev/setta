import { Toggle } from "components/Utils/atoms/toggles/Toggle";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { maybeRunGuiToYamlOnAllSections } from "state/actions/guiToYaml";
import { toggleProjectConfigPreviewEnabled } from "state/actions/localStorage";
import { setAllPreviewVariantIdsToNull } from "state/actions/sectionInfos";
import { useAllProjectConfigs, useSectionInfos } from "state/definitions";
import { localStorageFns } from "state/hooks/localStorage";
import { useLoadFullProject } from "state/hooks/project";
import { PAGE_LOAD_TYPES, pathRelativeToProject } from "utils/constants";

export const ProjectConfigs = React.forwardRef(() => {
  const allConfigNames = useAllProjectConfigs((x) => x.names);
  const [previewEnabled] = localStorageFns.projectConfigPreviewEnabled.hook();
  const { doneLoading, currProjectConfigName } =
    useLoadFullProject(previewEnabled);
  const [mousedOverName, setMousedOverName] = useState(currProjectConfigName);

  return (
    <>
      <aside className="mb-2 flex items-center justify-between">
        <p className="text-xs text-setta-500">Toggle config previews.</p>
        <Toggle
          checked={previewEnabled}
          onCheckedChange={toggleProjectConfigPreviewEnabled}
          twThumbClasses="flex"
        />
      </aside>
      {/* 
      <p className="text-xs text-setta-600 dark:text-setta-300">
        Hover over an item to preview another version of your project
      </p> */}
      <section className=" flex h-full overflow-y-scroll rounded-lg border border-setta-200/50 p-1 dark:border-setta-850">
        <div
          className="mt-1 flex w-full flex-col gap-1"
          onMouseLeave={() => {
            setMousedOverName(currProjectConfigName);
            onMouseLeave();
          }}
        >
          {doneLoading ? (
            allConfigNames.map((name, idx) => (
              <Link
                to={pathRelativeToProject(name)}
                key={idx}
                className="grouop flex min-w-full cursor-pointer flex-row items-center justify-between overflow-clip truncate rounded-xl px-2 py-1 hover:bg-blue-300/40 dark:hover:bg-blue-900/50"
                onMouseEnter={() => {
                  setMousedOverName(name);
                  onMouseEnter({
                    previewEnabled,
                    mousedOverName: name,
                    currProjectConfigName,
                  });
                }}
                state={{ pageLoadType: PAGE_LOAD_TYPES.LOAD_PROJECT_CONFIG }}
              >
                <p
                  className={`${(previewEnabled && mousedOverName === name) || (!previewEnabled && currProjectConfigName === name) ? "font-black !text-setta-900 dark:!text-setta-100" : ""} flex-shrink truncate text-xs text-setta-600 [transition:font-weight_100ms_ease-in-out]  group-hover:!text-setta-900 dark:text-setta-400 dark:group-hover:!text-setta-100`}
                >
                  {name}
                </p>
              </Link>
            ))
          ) : (
            <i className="gg-spinner self-center justify-self-end text-blue-500/70" />
          )}
        </div>
      </section>
    </>
  );
});

function onMouseEnter({
  mousedOverName,
  previewEnabled,
  currProjectConfigName,
}) {
  // preview not enabled
  if (!previewEnabled) {
    return;
  }

  if (mousedOverName !== currProjectConfigName) {
    const previewSectionConfigs =
      useAllProjectConfigs.getState().x[mousedOverName].sections;

    useSectionInfos.setState((x) => {
      for (const [k, v] of Object.entries(x.x)) {
        if (previewSectionConfigs[k]) {
          v.previewVariantId = previewSectionConfigs[k].variantId;
        } else {
          v.previewVariantId = null;
        }
      }
    });

    maybeRunGuiToYamlOnAllSections(true);
  } else {
    setAllPreviewVariantIdsToNull();
    maybeRunGuiToYamlOnAllSections(false);
  }
}

function onMouseLeave() {
  setAllPreviewVariantIdsToNull();
  maybeRunGuiToYamlOnAllSections(false);
}
