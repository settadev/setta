import { SaveLoadModal } from "components/Modals/SaveLoadModal/SaveLoadModal";
import _ from "lodash";
import { useNavigateToAnotherConfig } from "state/actions/project/loadProject";
import {
  saveAsExistingProjectConfig,
  saveAsNewProjectConfig,
  saveProject,
} from "state/actions/project/saveProject";
import { useSectionInfos } from "state/definitions";
import { useGetAllProjectConfigMetadataForFileMenu } from "state/hooks/project";
import { MODAL_TYPE } from "utils/constants";

export function FileMenuSaveAsModal({ open, modalType }) {
  const projectConfigs = useGetAllProjectConfigMetadataForFileMenu(open);
  const navigateToAnotherConfig = useNavigateToAnotherConfig();

  async function onClickSaveAsProject({ selected, filename }) {
    if (selected === useSectionInfos.getState().projectConfig.id) {
      saveProject();
    } else {
      selected
        ? await saveAsExistingProjectConfig({
            configName: filename,
          })
        : await saveAsNewProjectConfig({
            newConfigName: filename,
            withRefs: _.isEqual(
              modalType,
              MODAL_TYPE.SAVE_PROJECT_CONFIG_AS_WITH_REFS,
            ),
          });

      navigateToAnotherConfig(filename);
    }
  }

  return (
    <SaveLoadModal
      modalPurpose={modalType.purpose}
      files={projectConfigs}
      onClickActionButton={onClickSaveAsProject}
      title={modalType.title}
      buttonText={modalType.buttonText}
      placeholder="Project Config Name"
    />
  );
}
