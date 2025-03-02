import { CustomResizable } from "components/Utils/Resizable/CustomResizable";
import C from "constants/constants.json";
import _ from "lodash";
import { getIsUserView } from "state/actions/sectionInfos";
import { getIsRoot } from "state/actions/uiTypes/utils";
import { useSectionInfos } from "state/definitions";
import { getIsYouTubeSection } from "state/hooks/social";
import { SectionHeader } from "../Header/SectionHeader";
import { ChartArea } from "../Layouts/ChartArea/ChartArea";
import { ChatArea } from "../Layouts/ChatArea";
import { CodeArea } from "../Layouts/CodeArea";
import { DrawArea } from "../Layouts/DrawArea/DrawArea";
import { GlobalParamSweepArea } from "../Layouts/GlobalParamSweepArea";
import { GlobalVariablesArea } from "../Layouts/GlobalVariablesArea";
import { IframeArea } from "../Layouts/IframeArea";
import { ImageArea } from "../Layouts/ImageArea";
import { InputArea } from "../Layouts/InputArea";
import { ParamSweepArea } from "../Layouts/ParamSweepArea";
import { SocialArea } from "../Layouts/SocialArea";
import { TerminalArea } from "../Layouts/TerminalArea";
import { TextBlock } from "../Layouts/TextBlock";
import { Incrementer } from "../SectionParts/Incrementer";
import "./dndline.css";
import { getBgColor } from "./utils";

export function SectionContainerCoreResizable({
  sectionId,
  sectionTypeName,
  isActiveSection,
  isInOtherProjectConfigs,
  viewingEditingMode,
  positionAndSizeLocked,
}) {
  const { isMinimized, isYouTube } = useSectionInfos((x) => {
    return {
      isMinimized: x.x[sectionId].isMinimized,
      isYouTube: getIsYouTubeSection(sectionId, x),
    };
  }, _.isEqual);

  const isRoot = getIsRoot(sectionTypeName);
  const bgColor = getBgColor(sectionTypeName);
  const isUserView = getIsUserView(viewingEditingMode);

  return (
    <CustomResizable
      sectionId={sectionId}
      bgColor={bgColor}
      isYouTube={isYouTube}
      isActiveSection={isActiveSection}
      positionAndSizeLocked={positionAndSizeLocked}
    >
      <SectionHeader
        sectionId={sectionId}
        isActiveSection={isActiveSection}
        sectionTypeName={sectionTypeName}
        isInOtherProjectConfigs={isInOtherProjectConfigs}
        viewingEditingMode={viewingEditingMode}
        isUserView={isUserView}
        isRoot={isRoot}
      />
      {isRoot && <Incrementer sectionId={sectionId} isRoot={isRoot} />}
      {!isMinimized && (
        <AreaSwitch
          sectionId={sectionId}
          sectionTypeName={sectionTypeName}
          bgColor={bgColor}
          isUserView={isUserView}
        />
      )}
    </CustomResizable>
  );
}

function AreaSwitch({ sectionId, sectionTypeName, bgColor, isUserView }) {
  switch (sectionTypeName) {
    case C.SECTION:
      return (
        <InputArea
          sectionId={sectionId}
          bgColor={bgColor}
          isUserView={isUserView}
        />
      );
    case C.IMAGE:
      return <ImageArea sectionId={sectionId} />;
    case C.CHART:
      return <ChartArea sectionId={sectionId} />;
    case C.DRAW:
      return <DrawArea sectionId={sectionId} />;
    case C.SOCIAL:
      return <SocialArea sectionId={sectionId} />;
    case C.TEXT_BLOCK:
      return <TextBlock sectionId={sectionId} />;
    case C.GLOBAL_VARIABLES:
      return (
        <GlobalVariablesArea
          sectionId={sectionId}
          bgColor={bgColor}
          isUserView={isUserView}
        />
      );
    case C.CODE:
      return <CodeArea sectionId={sectionId} />;
    case C.PARAM_SWEEP:
      return <ParamSweepArea sectionId={sectionId} />;
    case C.TERMINAL:
      return <TerminalArea sectionId={sectionId} />;
    case C.GLOBAL_PARAM_SWEEP:
      return <GlobalParamSweepArea sectionId={sectionId} />;
    case C.IFRAME:
      return <IframeArea sectionId={sectionId} />;
    case C.CHAT:
      return <ChatArea sectionId={sectionId} />;
    default:
      return null;
  }
}
