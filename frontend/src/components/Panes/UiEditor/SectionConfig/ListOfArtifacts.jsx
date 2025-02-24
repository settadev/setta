import * as Accordion from "@radix-ui/react-accordion";
import { Editable } from "components/Utils/Editable";
import C from "constants/constants.json";
import _ from "lodash";
import { useEffect, useState } from "react";
import { BiPaint } from "react-icons/bi";
import { FaObjectGroup } from "react-icons/fa6";
import { FiChevronDown, FiTrash2 } from "react-icons/fi";
import { dbLoadAvailableArtifacts } from "requests/artifacts";
import { updateArtifactGroupAndSetArtifactId } from "state/actions/artifacts";
import { useArtifacts, useSectionInfos } from "state/definitions";
import {
  getAllSectionArtifactIds,
  getSectionArtifactGroupMetadata,
} from "state/hooks/artifacts";
import { useEditableOnSubmit } from "state/hooks/editableText";
import { newArtifactTransform } from "utils/objs/artifact";

const LayersList = ({
  sectionId,
  availableArtifacts,
  onDrop,
  draggedId,
  onDeleteArtifact,
}) => {
  const layers = useSectionInfos(
    (state) => getSectionArtifactGroupMetadata(sectionId, state),
    _.isEqual,
  );

  const reversedLayers = layers.toReversed();

  const [hoveredLayer, setHoveredLayer] = useState(null);

  const handleDragOver = (e, layerId) => {
    setHoveredLayer(layerId);
  };

  const handleDragLeave = () => {
    setHoveredLayer(null);
  };

  const handleDrop = (e, layerId) => {
    setHoveredLayer(null);
    const artifactId = e.dataTransfer.getData("text/plain");
    onDrop(artifactId, layerId);
  };

  const getLayerStyle = (layer) => {
    if (!draggedId || hoveredLayer !== layer.id) {
      return "border-setta-300 dark:border-setta-600";
    }

    return "border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-800 dark:[&_*]:text-white/50";
  };

  function getArtifactTypeIcon(type) {
    switch (type) {
      case "img":
        return <i className="gg-image text-setta-300 dark:text-setta-600" />;
      case "brushStrokes":
        return <BiPaint className="text-setta-300 dark:text-setta-600" />;
    }
  }

  return (
    <>
      <h3 className="mt-1 text-sm font-bold text-setta-400 dark:text-setta-600">
        Add / Remove Layer Contents
      </h3>
      <section className="mb-4 rounded-xl border border-white bg-white px-4 py-2 shadow-[inset_0_3px_8px_0_rgb(0_0_0_/_0.15)] dark:border-setta-700 dark:bg-setta-800 dark:shadow-[inset_0_1px_8px_0_rgb(0_0_0_/_0.6)]">
        {reversedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`-mx-2 mb-2 rounded-lg  px-2 py-1 transition-colors hover:bg-setta-100/30 dark:hover:bg-setta-900/50 ${getLayerStyle(layer)} ${
              draggedId
                ? "cursor-copy border border-dashed border-blue-500"
                : "border !border-transparent"
            }`}
            onDragOver={(e) => handleDragOver(e, layer.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, layer.id)}
          >
            <header className="flex gap-1">
              <FaObjectGroup className="text-setta-300 dark:text-setta-600" />
              <h4 className="truncate text-xs font-bold uppercase text-setta-600 dark:text-setta-400">
                {layer.name}
              </h4>
            </header>

            <div className="ml-2">
              {layer.artifactIdsUsed.toReversed().map((artifactId, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between text-xs text-setta-600 dark:text-setta-400"
                >
                  <div className="flex gap-1">
                    {getArtifactTypeIcon(availableArtifacts[artifactId]?.type)}
                    <p>{availableArtifacts[artifactId]?.name}</p>
                  </div>

                  <button
                    onClick={() =>
                      onDeleteArtifact(
                        layer.id,
                        layer.artifactIdsUsed.length - 1 - idx,
                      )
                    }
                    className="cursor-pointer p-1 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

function ListOfArtifacts({
  availableArtifacts,
  onDragStart,
  onDragEnd,
  onClick,
  getItemStyle,
}) {
  const [loadedDetails, setLoadedDetails] = useState({});

  const draggable = Boolean(onDragStart);

  if (draggable) {
    return (
      <ImageArtifactObjects
        availableArtifacts={availableArtifacts}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        getItemStyle={getItemStyle}
        draggable={draggable}
        loadedDetails={loadedDetails}
      />
    );
  }
  return (
    <ChartArtifactObjects
      availableArtifacts={availableArtifacts}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      getItemStyle={getItemStyle}
      draggable={draggable}
      loadedDetails={loadedDetails}
    />
  );
}

function ImageArtifactObjects({
  availableArtifacts,
  onDragStart,
  onDragEnd,
  onClick,
  getItemStyle,
  draggable,
  loadedDetails,
}) {
  return (
    <>
      <h3 className="mt-1 text-sm font-bold text-setta-400 dark:text-setta-600">
        Available Layer Objects (Drag & Drop)
      </h3>

      <Accordion.Root
        type="multiple"
        className="flex w-full flex-col gap-2 rounded-lg bg-setta-500/10 px-4 py-4"
      >
        {Object.entries(availableArtifacts).map(([id, item]) => (
          <Accordion.Item
            key={id}
            value={item.name}
            className={`flex flex-col rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl dark:bg-setta-800 dark:!shadow-setta-900 ${draggable ? "cursor-move" : "cursor-pointer"} mx-1 justify-center border px-2 py-1 ${getItemStyle?.(id) ?? "border-transparent  hover:border-white dark:border-setta-700 dark:hover:bg-setta-700"}`}
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, id)}
            onDragEnd={onDragEnd}
            onClick={() => onClick?.(id, item.type)}
          >
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <header className="flex min-w-0">
                  <p className="truncate text-xs font-bold text-setta-600 dark:text-setta-200">
                    {item.name}
                  </p>
                  <p className="ml-2 truncate text-xs text-setta-500 dark:text-setta-400">
                    {item.type}
                  </p>
                </header>
                <Accordion.Trigger className="cursor-pointer p-2">
                  <FiChevronDown className="transform text-setta-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180 dark:text-setta-400" />
                </Accordion.Trigger>
              </div>
              {Boolean(item.path) && (
                <div className="mb-2 truncate text-xs text-setta-500 dark:text-setta-400">
                  {item.path}
                </div>
              )}
            </div>

            <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <div className="rounded-md bg-setta-50 px-3 py-2 dark:bg-setta-900/50">
                {loadedDetails[item.id] ? (
                  <pre className="text-xs text-setta-900 dark:text-setta-100">
                    {JSON.stringify(loadedDetails[item.id], null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-setta-500 dark:text-setta-400">
                    No additional details available
                  </div>
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </>
  );
}

function ChartArtifactObjects({
  availableArtifacts,
  onDragStart,
  onDragEnd,
  onClick,
  getItemStyle,
  draggable,
  loadedDetails,
}) {
  return (
    <>
      <h3 className="mb-2 text-sm font-bold text-setta-400 dark:text-setta-600">
        Available Objects
      </h3>

      <Accordion.Root type="multiple" className="flex w-full flex-col gap-2">
        {Object.entries(availableArtifacts).map(([id, item]) => (
          <Accordion.Item
            key={id}
            value={item.name}
            className={`flex flex-col rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl dark:bg-setta-800 dark:!shadow-setta-900 ${draggable ? "cursor-move" : "cursor-pointer"} mx-1 justify-center border px-2 py-1 ${getItemStyle?.(id) ?? "border-transparent  hover:border-white dark:border-setta-700 dark:hover:bg-setta-700"}`}
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, id)}
            onDragEnd={onDragEnd}
            onClick={() => onClick?.(id, item.type)}
          >
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <header className="flex min-w-0">
                  <EditableArtifactName id={id} name={item.name} />
                  <p className="ml-2 truncate text-xs text-setta-500 dark:text-setta-400">
                    {item.type}
                  </p>
                </header>
                <Accordion.Trigger className="cursor-pointer p-2">
                  <FiChevronDown className="transform text-setta-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180 dark:text-setta-400" />
                </Accordion.Trigger>
              </div>
              {Boolean(item.path) && (
                <div className="mb-2 truncate text-xs text-setta-500 dark:text-setta-400">
                  {item.path}
                </div>
              )}
            </div>

            <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <div className="rounded-md bg-setta-50 px-3 py-2 dark:bg-setta-900/50">
                {loadedDetails[item.id] ? (
                  <pre className="text-xs text-setta-900 dark:text-setta-100">
                    {JSON.stringify(loadedDetails[item.id], null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-setta-500 dark:text-setta-400">
                    No additional details available
                  </div>
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </>
  );
}

function EditableArtifactName({ id, name }) {
  function onTitleInputChange(newName) {
    useArtifacts.setState((state) => {
      const updated = _.cloneDeep(state.x[id]);
      updated.name = newName;
      return { ...state.x, [id]: updated };
    });
  }

  const [inputValue, onChange, onBlur, onKeyDown, blurTriggeredByEscapeKey] =
    useEditableOnSubmit(name, onTitleInputChange, () => true);

  return (
    <Editable
      value={inputValue}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      titleProps={{
        editing:
          "truncate text-xs font-bold text-setta-600 dark:text-setta-200",
        notEditing:
          "truncate text-xs font-bold text-setta-600 dark:text-setta-200",
      }}
      doubleClickToEdit={true}
      blurTriggeredByEscapeKey={blurTriggeredByEscapeKey}
    />
  );
}

export function LayerListAndListOfArtifacts({ sectionId, sectionTypeName }) {
  const availableArtifacts = useArtifactsKnownByDbAndInMemory(sectionTypeName);
  const [draggedId, setDraggedId] = useState(null);

  const handleLayerDrop = (artifactId, targetLayerId) => {
    useSectionInfos.setState((x) => {
      const targetLayer = x.artifactGroups[targetLayerId];
      const artifactType = availableArtifacts[artifactId].type;
      targetLayer.artifactTransforms.push(
        newArtifactTransform(artifactId, sectionTypeName, artifactType),
      );
    });
  };

  const handleDeleteArtifact = (layerId, artifactIdx) => {
    useSectionInfos.setState((x) => {
      const targetLayer = x.artifactGroups[layerId];
      targetLayer.artifactTransforms = targetLayer.artifactTransforms.filter(
        (t, idx) => idx !== artifactIdx,
      );
    });
  };

  const onDragEnd = () => {
    setDraggedId(null);
  };

  const onDragStart = (e, artifactId) => {
    e.dataTransfer.setData("text/plain", artifactId);
    setDraggedId(artifactId);
  };

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-x-clip overflow-y-scroll [&>*]:mx-[2px]">
      <LayersList
        sectionId={sectionId}
        availableArtifacts={availableArtifacts}
        onDrop={handleLayerDrop}
        draggedId={draggedId}
        onDeleteArtifact={handleDeleteArtifact}
      />
      <ListOfArtifacts
        availableArtifacts={availableArtifacts}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </div>
  );
}

export function JustListOfArtifacts({ sectionId, sectionTypeName }) {
  const availableArtifacts = useArtifactsKnownByDbAndInMemory(sectionTypeName);
  const selectedArtifactIds = useSectionInfos(
    (state) => getAllSectionArtifactIds(sectionId, state),
    _.isEqual,
  );

  function getItemStyle(id) {
    return selectedArtifactIds.has(id)
      ? "!bg-blue-500 [&_*]:!text-white dark:!bg-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 border-transparent"
      : null;
  }

  function onClick(artifactId, artifactType) {
    useSectionInfos.setState((state) => {
      updateArtifactGroupAndSetArtifactId({
        sectionId,
        sectionTypeName,
        artifactId,
        artifactType,
        add: !selectedArtifactIds.has(artifactId),
        state,
      });
    });
  }

  return (
    <ListOfArtifacts
      availableArtifacts={availableArtifacts}
      getItemStyle={getItemStyle}
      onClick={onClick}
    />
  );
}

function useArtifactsKnownByDbAndInMemory(sectionTypeName) {
  const [artifactsKnownByDb, setArtifactsKnownByDb] = useState({});
  const artifactsInMemory = useArtifacts((x) => {
    const output = {};
    for (const [id, a] of Object.entries(x.x)) {
      if (C.ALLOWED_ARTIFACT_TYPES[sectionTypeName].includes(a.type)) {
        output[id] = a;
      }
    }
    return output;
  }, _.isEqual);

  useEffect(() => {
    async function fn() {
      const res = await dbLoadAvailableArtifacts(sectionTypeName);
      if (res.status == 200) {
        setArtifactsKnownByDb(res.data);
      }
    }

    fn();
  }, []);

  return { ...artifactsKnownByDb, ...artifactsInMemory };
}
