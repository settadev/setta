import { getFloatingBoxHandlers } from "components/Utils/FloatingBox";
import C from "constants/constants.json";
import _ from "lodash";
import { BiPaint } from "react-icons/bi";
import { FaMarkdown, FaTerminal, FaYoutube } from "react-icons/fa";
import { FaChartPie, FaLayerGroup, FaSquareXTwitter } from "react-icons/fa6";
import { GoDotFill } from "react-icons/go";
import { GrFormView } from "react-icons/gr";
import { IoLogoJavascript } from "react-icons/io";
import { PiTextTFill } from "react-icons/pi";
import { RiGlobalFill } from "react-icons/ri";
import { SiGnubash, SiPython } from "react-icons/si";
import { TbArrowIteration } from "react-icons/tb";
import { getSectionType } from "state/actions/sectionInfos";
import { useSectionInfos } from "state/definitions";
import { useListElementIdx } from "state/hooks/sectionVariants";
import { linkIsTwitter, linkIsYouTube } from "state/hooks/social";

export function HeaderIcon({
  sectionId,
  sectionTypeName,
  isInOtherProjectConfigs,
  isListElement,
}) {
  if (isListElement) {
    return <ListElementIcon sectionId={sectionId} />;
  }

  if (isInOtherProjectConfigs) {
    return <IsInOtherProjectConfigsIcon sectionId={sectionId} />;
  }

  switch (sectionTypeName) {
    case C.CODE:
      return (
        <CodeLanguageIcon
          sectionId={sectionId}
          classes="text-setta-300  group-hover/card-section:text-blue-500 dark:group-hover/card-section:text-[#0084ff] dark:text-setta-500  transition-colors"
        />
      );
    case C.TERMINAL:
      return <TerminalIcon sectionId={sectionId} />;
    case C.GLOBAL_PARAM_SWEEP:
    case C.GLOBAL_VARIABLES:
      return (
        <RiGlobalFill className="text-setta-300 transition-colors group-hover/card-section:text-green-500  dark:text-setta-500 " />
      );
    case C.PARAM_SWEEP:
      return (
        <TbArrowIteration className="text-setta-300 transition-colors group-hover/card-section:text-blue-500  dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] " />
      );
    case C.INFO:
      return <InfoIcon sectionId={sectionId} />;
    case C.IMAGE:
      return (
        <div className="relative">
          <i className="gg-image absolute inset-0 !scale-50 text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff]" />
        </div>
      );
    case C.DRAW:
      return (
        <BiPaint className="p-0 text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] " />
      );
    case C.IFRAME:
      return (
        <div className="relative flex w-2 justify-center">
          <i className="gg-code-slash !rotate-[14deg] !scale-50 text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff]" />
        </div>
      );
    case C.SOCIAL:
      return <SocialIcon sectionId={sectionId} />;
    case C.GROUP:
      return (
        <FaLayerGroup
          className="[&_*]:!scale-120 text-setta-400 transition-colors group-hover/group-section:text-blue-600  dark:text-setta-500 dark:group-hover/group-section:text-[#0084ff]
          "
        />
      );
    case C.CHART:
      return (
        <FaChartPie
          className="text-setta-300 transition-colors group-hover/card-section:text-blue-500  dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff]
          "
        />
      );
    default:
      return (
        <i className="gg-menu group/card-section:hover:bg !scale-110 text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] " />
      );
  }
}

function IsInOtherProjectConfigsIcon({ sectionId }) {
  const isGroup = useSectionInfos(
    (x) => getSectionType(sectionId, x) === C.GROUP,
  );

  return (
    <i
      className={`gg-link group/card-section:hover:bg  transition-colors group-hover/card-section:text-pink-500  dark:group-hover/card-section:text-[#ff00ff] ${isGroup ? "-rotate-45 !scale-75 text-purple-600 dark:text-purple-700" : "text-purple-500 dark:text-purple-500"}`}
    />
  );
}

function SocialIcon({ sectionId }) {
  const { isYouTube, isTwitter } = useSectionInfos((x) => {
    return {
      isYouTube: linkIsYouTube(x.x[sectionId].social),
      isTwitter: linkIsTwitter(x.x[sectionId].social),
    };
  }, _.isEqual);

  if (isYouTube) {
    return (
      <FaYoutube className="fill-setta-300 transition-colors group-hover/card-section:fill-blue-500 dark:fill-setta-500 dark:group-hover/card-section:fill-[#0084ff] " />
    );
  } else if (isTwitter) {
    return (
      <FaSquareXTwitter className="fill-setta-300 transition-colors group-hover/card-section:fill-blue-500 dark:fill-setta-500 dark:group-hover/card-section:fill-[#0084ff] " />
    );
  } else {
    return (
      <GoDotFill className="text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] " />
    );
  }
}

function CodeLanguageIcon({ sectionId, classes }) {
  const codeLanguage = useSectionInfos((x) => x.x[sectionId].codeLanguage);
  switch (codeLanguage) {
    case "python":
      return <SiPython className={classes} />;
    case "javascript":
      return <IoLogoJavascript className={classes} />;
    case "bash":
      return <SiGnubash className={classes} />;
    default:
      return null;
  }
}

function ListElementIcon({ sectionId }) {
  const idx = useListElementIdx(sectionId);
  return (
    <p className="group/card-section:hover:bg font-mono text-[9px] tracking-tighter text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] ">
      [{idx}]
    </p>
  );
}

function InfoIcon({ sectionId }) {
  const renderMarkdown = useSectionInfos((x) => x.x[sectionId].renderMarkdown);

  return renderMarkdown ? (
    <FaMarkdown className="text-transparent transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:text-transparent dark:group-hover/card-section:text-[#0084ff]" />
  ) : (
    <PiTextTFill className="text-transparent transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:text-transparent dark:group-hover/card-section:text-[#0084ff]" />
  );
  // <i className="gg-pen -rotate-45 !scale-50 text-setta-300 transition-colors group-hover/card-section:text-blue-500 dark:text-setta-500 dark:text-transparent dark:group-hover/card-section:text-[#0084ff] " />
}

function TerminalIcon({ sectionId }) {
  const isReadOnlyTerminal = useSectionInfos(
    (x) => x.x[sectionId].isReadOnlyTerminal,
  );

  return isReadOnlyTerminal ? (
    <GrFormView
      className="text-setta-300 transition-colors group-hover/card-section:text-blue-500  dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] "
      {...getFloatingBoxHandlers({ title: "Read-only terminal" })}
    />
  ) : (
    <FaTerminal
      className="text-setta-300 transition-colors group-hover/card-section:text-blue-500  dark:text-setta-500 dark:group-hover/card-section:text-[#0084ff] "
      {...getFloatingBoxHandlers({ title: "Read/write terminal" })}
    />
  );
}
