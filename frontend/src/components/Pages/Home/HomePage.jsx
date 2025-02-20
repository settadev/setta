import { IconButton } from "components/Utils/atoms/buttons/IconButton";
import { StandardButton } from "components/Utils/atoms/buttons/StandardButton";
import { GridWrapper } from "components/Utils/GridWrapper";
import { getNodesBounds } from "forks/xyflow/core/utils/graph";
import { getXYWidthHeight, MinimapSvg } from "forks/xyflow/minimap/MiniMap";
import { matchSorter } from "match-sorter";
import { forwardRef, useEffect, useState } from "react";
import { BiPlus } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { IoMdCheckmark } from "react-icons/io";
import { IoClose, IoSettingsOutline } from "react-icons/io5";
import { LuPenLine } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import { dbSetAsDefaultProject } from "requests/projects";
import { openDeleteProjectWarningModal } from "state/actions/modal";
import { useCreateAndGoToProjectConfig } from "state/actions/project/loadProject";
import { useHomePageSearch } from "state/definitions";
import { useGetAllProjectConfigMetadata } from "state/hooks/project";
import { PAGE_LOAD_TYPES, SETTINGS_ROUTER_PATH } from "utils/constants";
import { homePageProjectItemOnKeyDown } from "utils/tabbingLogic";
import "./homepage.css";

export function HomePage() {
  const [doRefresh, setDoRefresh] = useState(true);
  const { projects, defaultProjectName, getAllProjectConfigMetadata } =
    useGetAllProjectConfigMetadata();

  useEffect(() => {
    if (doRefresh) {
      getAllProjectConfigMetadata();
      setDoRefresh(false);
    }
  }, [doRefresh]);

  return (
    <GridWrapper gridStyles="bg-setta-100 dark:bg-setta-dark">
      <RightColumn
        projects={projects}
        defaultProjectName={defaultProjectName}
        setDoRefresh={setDoRefresh}
      />
    </GridWrapper>
  );
}

function RightColumn({ projects, defaultProjectName, setDoRefresh }) {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const createAndGoToProjectConfig = useCreateAndGoToProjectConfig();

  function onSelectProject(e, projectId) {
    e.preventDefault(); // to prevent going into the project
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter((x) => x !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  }

  async function onClickDelete() {
    openDeleteProjectWarningModal({
      setDoRefresh,
      setSelectedProjects,
      selectedProjects: selectedProjects.map((s) => ({
        id: s,
        name: projects.find((p) => p.id === s).name,
      })),
    });
  }

  function onEscapeClearSelectedProjects(e) {
    if (e.code === "Escape") {
      setSelectedProjects([]);
    }
  }

  async function onClickMakeDefault() {
    const projectId = selectedProjects[0];
    await dbSetAsDefaultProject(projectId);
    setDoRefresh(true);
  }

  return (
    <div
      className="overflow-y-auto px-10 py-8"
      onKeyDown={onEscapeClearSelectedProjects}
    >
      <div className="flex justify-between gap-4">
        <div className="flex gap-4">
          <StandardButton
            twClasses="py-2 px-4 rounded-full font-bold  text-white bg-setta-600  hover:bg-blue-500 dark:hover:bg-blue-700 gap-2"
            onClick={createAndGoToProjectConfig}
          >
            <BiPlus />
            New Config
          </StandardButton>
          <StandardButton
            twClasses="py-2 px-4 rounded-full font-medium text-white dark:text-white/75 bg-setta-400 dark:bg-setta-500/25 hover:!bg-green-500 dark:hover:!bg-green-700 hover:text-white gap-2"
            onClick={onClickMakeDefault}
            disabled={selectedProjects.length !== 1}
          >
            <HiHome />
            Make Default
          </StandardButton>
          <StandardButton
            twClasses="py-2 px-4 rounded-full font-medium text-white dark:text-white/75 bg-setta-400 dark:bg-setta-500/25 hover:!bg-red-500 hover:text-white gap-2"
            onClick={onClickDelete}
            disabled={selectedProjects.length === 0}
          >
            <IoClose />
            Delete
          </StandardButton>
        </div>
        <Link
          to={SETTINGS_ROUTER_PATH}
          className="nodrag inline-flex cursor-pointer items-center gap-2 rounded-full bg-setta-600 px-4 py-2  font-bold text-white  hover:bg-blue-500 focus-visible:ring-2 dark:hover:bg-blue-700 "
        >
          <IoSettingsOutline />
          Settings
        </Link>
      </div>
      <ProjectItems
        projects={projects}
        defaultProjectName={defaultProjectName}
        selectedProjects={selectedProjects}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}

function ProjectItems({
  projects,
  defaultProjectName,
  selectedProjects,
  onSelectProject,
}) {
  const searchValue = useHomePageSearch((x) => x.value);
  const filteredProjects = matchSorter(projects, searchValue, {
    keys: ["name"],
  });

  const gridStyles =
    "grid grid-cols-[repeat(minmax(0, 1fr))] md:grid-cols-[repeat(auto-fit,_minmax(15rem,_1fr))] xl:grid-cols-[repeat(auto-fill,_minmax(20rem,_1fr))] gap-8 pt-7 justify-items-start";

  return (
    <div className={gridStyles}>
      {filteredProjects.length === 0 ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <LuPenLine className="mx-auto h-32 w-32 text-setta-200 dark:text-setta-700/50" />
          <p className="text-center font-semibold text-setta-300 dark:text-setta-700">
            Create a New Config!
          </p>
        </div>
      ) : (
        filteredProjects.map((x, i) => (
          <ProjectItem
            project={x}
            isDefault={x.name === defaultProjectName}
            key={`Project ${i} ${x.name}`}
            isSelected={selectedProjects.includes(x.id)}
            onSelectProject={onSelectProject}
            inSelectionMode={selectedProjects.length > 0}
          />
        ))
      )}
    </div>
  );
}

const ProjectItem = forwardRef(
  (
    { project, isDefault, isSelected, onSelectProject, inSelectionMode },
    forwardedRef,
  ) => {
    const itemStyles =
      "relative grid grid-rows-[1fr_min-content] rounded-3xl border border-solid border-transparent min-h-[15rem] w-full overflow-hidden hover:transition-all hover:shadow-xl hover:cursor-pointer hover:border-white dark:hover:border-setta-600 gap-0";

    const WrapperDiv = !inSelectionMode ? Link : "div";
    const wrapperProps = !inSelectionMode
      ? {
          to: `/${project.name}`,
          state: { pageLoadType: PAGE_LOAD_TYPES.LOAD_PROJECT_CONFIG },
          className: "contents",
          relative: "path",
        }
      : {
          className: "contents",
          onClick: (e) => onSelectProject(e, project.id),
        };

    return (
      <div ref={forwardedRef} className={itemStyles}>
        <WrapperDiv {...wrapperProps}>
          <ThumbnailArea
            project={project}
            isSelected={isSelected}
            onSelectProject={onSelectProject}
          />
          <div className="col-start-1 col-end-2 row-start-2 row-end-3 w-full place-self-end bg-white px-5 py-4 dark:bg-setta-860">
            <div className="flex items-center justify-between">
              <p className="text-sm text-setta-600 dark:text-setta-100">
                {project.name}
              </p>
              {isDefault && (
                <HiHome className="h-4 w-4 text-setta-600 dark:text-setta-100" />
              )}
            </div>
          </div>
        </WrapperDiv>
      </div>
    );
  },
);

function ThumbnailArea({ project, isSelected, onSelectProject }) {
  const navigate = useNavigate();

  return (
    <div
      className={`absolute bottom-0 left-0 top-0 col-start-1 col-end-2 row-start-1 row-end-2 grid w-full bg-center p-4 ${project.previewImgColor}`}
    >
      <aside className="z-[10] col-start-1 col-end-2 row-start-1 row-end-2 flex w-full items-center justify-between gap-1 [place-self:flex-start_flex-end]">
        <IconButton
          icon={<IoMdCheckmark />}
          color="text-white/50 hover:text-white"
          bg={isSelected ? "bg-blue-500" : "bg-black/20 hover:bg-blue-500"}
          size="w-4 h-4"
          onClick={(e) => onSelectProject(e, project.id)}
        />
      </aside>

      <div
        className="col-start-1 col-end-2 row-start-1 row-end-2 -m-4 grid place-items-center overflow-hidden opacity-50 mix-blend-multiply [&>*]:scale-150"
        tabIndex="0"
        onKeyDown={(e) =>
          homePageProjectItemOnKeyDown(e, navigate, project.name)
        }
      >
        <PreviewImg previewImgNodes={project.childrenForPreviewImg} />
      </div>
    </div>
  );
}

function PreviewImg({ previewImgNodes }) {
  const nodes = previewImgNodes.map((n) => ({
    position: { x: n.x, y: n.y },
    width: n.w,
    height: n.h,
  }));

  const elementWidth = 200;
  const elementHeight = 150;
  const boundingRect = getNodesBounds(nodes);
  const { x, y, width, height, offset } = getXYWidthHeight({
    boundingRect,
    elementHeight,
    elementWidth,
    offsetScale: 5,
  });

  return MinimapSvg({
    elementWidth: 200,
    elementHeight: 150,
    x,
    y,
    width,
    height,
    offset,
    nodes,
    nodeColor: "#2D384D",
    nodeStrokeColor: "transparent",
    nodeBorderRadius: 5,
    nodeStrokeWidth: 2,
    nodeClassName: "",
    maskColor: "rgb(20, 22, 31, 0.5)",
    maskStrokeColor: "none",
    maskStrokeWidth: 1,
  });
}
