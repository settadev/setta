import { AvailableColors } from "components/Params/ParamUIs/ColorPickerInput";
import C from "constants/constants.json";
import _ from "lodash";
import { useSectionInfos } from "state/definitions";
import { LayerListAndListOfArtifacts } from "./ListOfArtifacts";

export function DrawAreaSettings({ sectionId }) {
  return (
    <>
      <DrawAreaAvailableColors sectionId={sectionId} />
      <LayerListAndListOfArtifacts
        sectionId={sectionId}
        sectionTypeName={C.DRAW}
      />
    </>
  );
}

function DrawAreaAvailableColors({ sectionId }) {
  const colors = useSectionInfos(
    (x) => x.x[sectionId].canvasSettings?.colorChoices ?? [],
    _.isEqual,
  );

  const addColor = () => {
    setCanvasColorChoices(sectionId, [
      ...colors,
      { color: "#000000", description: "" },
    ]);
  };

  const removeColor = (removeIdx) => {
    setCanvasColorChoices(
      sectionId,
      colors.filter((color, idx) => idx !== removeIdx),
    );
  };

  const updateColor = (updateIdx, newColor) => {
    setCanvasColorChoices(
      sectionId,
      colors.map((color, idx) =>
        idx === updateIdx ? { ...color, color: newColor } : color,
      ),
    );
  };

  const updateDescription = (updateIdx, description) => {
    setCanvasColorChoices(
      sectionId,
      colors.map((color, idx) =>
        idx === updateIdx ? { ...color, description } : color,
      ),
    );
  };

  return (
    <AvailableColors
      colors={colors}
      addColor={addColor}
      removeColor={removeColor}
      updateColor={updateColor}
      updateDescription={updateDescription}
    />
  );
}

function setCanvasColorChoices(sectionId, value) {
  useSectionInfos.setState((x) => {
    const s = x.x[sectionId];
    s.canvasSettings.colorChoices = value;
  });
}
