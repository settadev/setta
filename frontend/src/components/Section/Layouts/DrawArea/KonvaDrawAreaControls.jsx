import { useState } from "react";

// Placeholder for icons - you would import these from your actual icon libraries
const BiPaint = () => <span>🖌️</span>;
const IoMove = () => <span>🔄</span>;
const BsLayers = () => <span>📑</span>;

// Simple popover component for our example
const StandardPopover = ({
  trigger,
  header,
  children,
  contentClasses = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className={`absolute top-full mt-1 ${contentClasses}`}>
          <div className="p-2">
            <div className="mb-2 font-medium">{header}</div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// Settings subcomponents
const BrushSettings = ({
  opacity,
  setOpacity,
  brushSize,
  setBrushSize,
  brushShape,
  setBrushShape,
}) => (
  <div className="flex w-full flex-col gap-2">
    <div className="flex items-center justify-between">
      <div>Opacity:</div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={opacity}
        onChange={(e) => setOpacity(parseFloat(e.target.value))}
        className="w-24"
      />
      <span>{(opacity * 100).toFixed(0)}%</span>
    </div>
    <div className="flex items-center justify-between">
      <div>Size:</div>
      <input
        type="range"
        min="1"
        max="50"
        value={brushSize}
        onChange={(e) => setBrushSize(parseInt(e.target.value))}
        className="w-24"
      />
      <span>{brushSize}px</span>
    </div>
  </div>
);

const EraserSettings = ({ brushSize, setBrushSize }) => (
  <div className="flex w-full flex-col gap-2">
    <div className="flex items-center justify-between">
      <div>Size:</div>
      <input
        type="range"
        min="1"
        max="50"
        value={brushSize}
        onChange={(e) => setBrushSize(parseInt(e.target.value))}
        className="w-24"
      />
      <span>{brushSize}px</span>
    </div>
  </div>
);

const LayerSettings = ({ opacity, setOpacity }) => (
  <div className="flex w-full flex-col gap-2">
    <div className="flex items-center justify-between">
      <div>Opacity:</div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={opacity}
        onChange={(e) => setOpacity(parseFloat(e.target.value))}
        className="w-24"
      />
      <span>{(opacity * 100).toFixed(0)}%</span>
    </div>
  </div>
);

const LayerList = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onAddLayer,
  onDeleteLayer,
}) => (
  <div className="flex max-h-48 w-full flex-col gap-2 overflow-y-auto">
    <div className="mb-1 flex items-center justify-between">
      <button
        className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
        onClick={() => onAddLayer("drawing", 1.0)}
      >
        Add Layer
      </button>
    </div>

    {layers.map((layer, index) => (
      <div
        key={layer.id}
        className={`flex items-center gap-2 rounded p-1 ${
          activeLayerId === layer.id ? "bg-blue-100" : ""
        }`}
        onClick={() => onLayerSelect(layer.id)}
      >
        <div
          className={`h-3 w-3 rounded-full ${
            activeLayerId === layer.id ? "bg-blue-500" : "bg-gray-300"
          }`}
        ></div>
        <span className="flex-1 text-sm">
          {layer.type === "image" ? "Image Layer" : "Drawing Layer"} {index + 1}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteLayer(layer.id);
          }}
          className="text-xs text-red-500 hover:text-red-700"
        >
          🗑️
        </button>
      </div>
    ))}
  </div>
);

// Main component
export function KonvaDrawAreaControls({
  activeLayerId,
  layers,
  onLayerSelect,
  onAddLayer,
  onLayerOpacityChange,
  onBrushOpacityChange,
  onBrushSizeChange,
  onEraserSizeChange,
  onColorChange,
  onToggleEraser,
  onDeleteLayer,
  onClearStrokes,
  isEraser,
  color,
  brushSize,
  eraserBrushSize,
  brushOpacity,
  layerOpacity,
  mode,
}) {
  // Color picker component
  const DrawAreaColorPicker = ({ color, setColor }) => (
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      className="colorpicker h-8 w-8 cursor-pointer rounded"
    />
  );

  const setToBrushMode = () => onToggleEraser(false);
  const setToEraserMode = () => onToggleEraser(true);
  const setToEditMode = () => {}; // Placeholder for now

  const handleLayerOpacityChange = (value) => {
    if (activeLayerId) {
      onLayerOpacityChange(activeLayerId, value);
    }
  };

  return (
    <div className="section-search section-w-full z-10 flex flex-wrap items-center gap-2 rounded-xl border-b border-solid border-white px-3 py-3 shadow-sm @container dark:border-setta-700 [&_.colorpicker]:!max-h-6 [&_.colorpicker]:max-w-24">
      <DrawAreaColorPicker color={color} setColor={onColorChange} />
      <div className="flex self-stretch">
        <button
          className={`flex w-8 cursor-pointer items-center justify-center gap-1 rounded-l-lg bg-setta-200/30 py-1 text-xs ${mode === "draw" && !isEraser ? "text-blue-500" : "text-setta-700 dark:text-setta-400"}  hover:bg-setta-200 dark:bg-setta-800/50  dark:hover:bg-setta-900`}
          onClick={setToBrushMode}
        >
          <BiPaint />
        </button>
        <StandardPopover
          contentClasses="z-20 bg-white dark:bg-setta-800 flex relative px-2 py-1 rounded-lg min-w-48"
          trigger={
            <button className="flex w-6 cursor-pointer items-center justify-center gap-1 rounded-r-lg border border-setta-300/5 bg-setta-200 py-1 text-xs text-setta-700 hover:bg-setta-200 dark:bg-setta-800 dark:text-setta-400 dark:hover:bg-setta-900">
              <span>▼</span>
            </button>
          }
          header={"Brush Settings"}
        >
          <BrushSettings
            opacity={brushOpacity}
            setOpacity={onBrushOpacityChange}
            brushSize={brushSize}
            setBrushSize={onBrushSizeChange}
            brushShape={"round"}
            setBrushShape={() => {}}
          />
        </StandardPopover>
      </div>
      <div className="flex self-stretch">
        <button
          className={`flex w-8 cursor-pointer items-center justify-center gap-1 rounded-l-lg bg-setta-200/30 py-1 text-xs ${mode === "draw" && isEraser ? "text-blue-500" : "text-setta-700 dark:text-setta-400"} hover:bg-setta-300 dark:bg-setta-800/50 dark:hover:bg-setta-900`}
          onClick={setToEraserMode}
        >
          <span>✨</span> {/* Eraser icon placeholder */}
        </button>
        <StandardPopover
          contentClasses="z-20 bg-white dark:bg-setta-800 flex relative px-2 py-1 rounded-lg min-w-48"
          trigger={
            <button className="flex w-6 cursor-pointer items-center justify-center gap-1 rounded-r-lg border border-setta-300/5 bg-setta-200 py-1 text-xs text-setta-700 hover:bg-setta-300 dark:bg-setta-800 dark:text-setta-400 dark:hover:bg-setta-900">
              <span>▼</span>
            </button>
          }
          header={"Eraser Settings"}
        >
          <EraserSettings
            brushSize={eraserBrushSize}
            setBrushSize={onEraserSizeChange}
          />
        </StandardPopover>
      </div>
      <button
        className={`flex w-8 cursor-pointer items-center justify-center gap-1 self-stretch rounded-lg bg-setta-200/30 py-1 text-xs ${mode === "edit" ? "text-blue-500" : "text-setta-700 dark:text-setta-400"} hover:bg-setta-300 dark:bg-setta-800/50 dark:hover:bg-setta-900`}
        onClick={setToEditMode}
      >
        <IoMove />
      </button>

      <StandardPopover
        contentClasses="z-20 bg-white dark:bg-setta-800 flex relative px-2 py-1 rounded-lg min-w-48"
        trigger={
          <button className="flex w-12 cursor-pointer items-center justify-center gap-0 self-stretch rounded-lg bg-setta-200/30 py-1 text-xs text-setta-700 hover:bg-setta-200 dark:bg-setta-800/50 dark:text-setta-400 dark:hover:bg-setta-900">
            <span>🖼️</span>
            <span>▼</span>
          </button>
        }
        header={"Layer Opacity"}
      >
        <LayerSettings
          opacity={layerOpacity}
          setOpacity={handleLayerOpacityChange}
        />
      </StandardPopover>

      <StandardPopover
        contentClasses="z-20 bg-white dark:bg-setta-800 flex relative px-2 py-1 rounded-lg min-w-48"
        trigger={
          <button className="flex w-12 cursor-pointer items-center justify-center gap-0 self-stretch rounded-lg bg-setta-200/30 py-1 text-xs text-setta-700 hover:bg-setta-200 dark:bg-setta-800/50 dark:text-setta-400 dark:hover:bg-setta-900">
            <BsLayers className="w-5" />
            <span>▼</span>
          </button>
        }
        header={"Layer Selection"}
      >
        <LayerList
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerSelect={onLayerSelect}
          onAddLayer={onAddLayer}
          onDeleteLayer={onDeleteLayer}
        />
      </StandardPopover>

      <button
        className="flex w-8 cursor-pointer items-center justify-center gap-1 self-stretch rounded-lg bg-setta-200/30 py-1 text-xs text-setta-700 hover:bg-red-600 hover:text-white dark:bg-setta-800/50 dark:text-setta-400 dark:hover:bg-red-800 dark:hover:text-white"
        onClick={onClearStrokes}
      >
        <span>🗑️</span>
      </button>
    </div>
  );
}
