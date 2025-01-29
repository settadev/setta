import { SaveLoadModal } from "components/Modals/SaveLoadModal/SaveLoadModal";
import { useNavigateToAnotherConfig } from "state/actions/project/loadProject";
import { useGetAllProjectConfigMetadataForFileMenu } from "state/hooks/project";

export function FileMenuLoadModal({ open, modalType }) {
  const projectConfigs = useGetAllProjectConfigMetadataForFileMenu(open);
  const navigateToAnotherConfig = useNavigateToAnotherConfig();

  function onClickLoadProjectConfig({ selected }) {
    const config = projectConfigs.find((x) => x.id === selected);
    if (config) {
      navigateToAnotherConfig(config.name);
    }
  }

  return (
    <SaveLoadModal
      modalPurpose={modalType.purpose}
      files={projectConfigs}
      onClickActionButton={onClickLoadProjectConfig}
      title={modalType.title}
      buttonText={modalType.buttonText}
    />
  );
}
