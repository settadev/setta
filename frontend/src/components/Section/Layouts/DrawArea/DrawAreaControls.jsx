export const DrawAreaControls = ({
  mode,
  opacity,
  brushSize,
  eraserSize,
  brushColor,
  layers,
  activeLayerId,
  onToolChange,
  onOpacityChange,
  onBrushSizeChange,
  onEraserSizeChange,
  onColorChange,
  onLayerOpacityChange,
  onAddLayer,
  onDeleteLayer,
  onToggleLayerVisibility,
  onSelectLayer,
}) => {
  return (
    <>
      <div className="flex flex-wrap gap-4 bg-gray-100 p-2">
        <div>
          <label className="mr-2">Tool:</label>
          <select
            value={mode}
            onChange={(e) => onToolChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="brush">Brush</option>
            <option value="eraser">Eraser</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Color:</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => onColorChange(e.target.value)}
            className={`h-8 w-10 cursor-pointer rounded ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
        </div>

        <div className="flex items-center">
          <label className="mr-2">Opacity:</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className={`w-32 ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
          <span className="ml-2 w-8">{(opacity * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Brush Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
            className={`w-32 ${mode !== "brush" ? "opacity-50" : ""}`}
            disabled={mode !== "brush"}
          />
          <span className="ml-2 w-8">{brushSize}px</span>
        </div>

        <div className="flex items-center">
          <label className="mr-2">Eraser Size:</label>
          <input
            type="range"
            min="1"
            max="100"
            value={eraserSize}
            onChange={(e) => onEraserSizeChange(parseInt(e.target.value, 10))}
            className={`w-32 ${mode !== "eraser" ? "opacity-50" : ""}`}
            disabled={mode !== "eraser"}
          />
          <span className="ml-2 w-8">{eraserSize}px</span>
        </div>
      </div>

      {/* Layers panel */}
      <div className="flex">
        <div className="flex w-48 flex-col bg-gray-200 p-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">Layers</h3>
            <button
              onClick={onAddLayer}
              className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
            >
              Add Layer
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`mb-1 flex cursor-pointer flex-col rounded p-2 ${
                  activeLayerId === layer.id
                    ? "border border-blue-300 bg-blue-100"
                    : "bg-white"
                }`}
                onClick={() => onSelectLayer(layer.id)}
              >
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayerVisibility(layer.id);
                    }}
                    className="mr-2 text-gray-600"
                  >
                    {layer.visible ? "👁️" : "👁️‍🗨️"}
                  </button>
                  <span className="flex-grow truncate">{layer.name}</span>
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="ml-2 text-sm text-red-500"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Layer opacity control */}
                <div
                  className="mt-2 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="mr-2 text-xs text-gray-600">Opacity:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) =>
                      onLayerOpacityChange(layer.id, parseFloat(e.target.value))
                    }
                    className="w-24 flex-grow"
                  />
                  <span className="ml-1 w-8 text-xs">
                    {(layer.opacity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
