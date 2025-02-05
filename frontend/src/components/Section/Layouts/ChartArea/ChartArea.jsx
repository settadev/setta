import Chart from "chart.js/auto";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { listenForCanvasToBase64Requests } from "state/actions/temporaryMiscState";
import { useSectionInfos } from "state/definitions";
import {
  useAllSectionArtifacts,
  useLoadArtifactViaDropzone,
} from "state/hooks/artifacts";
import { localStorageFns } from "state/hooks/localStorage";
import useDeepCompareEffect from "use-deep-compare-effect";
import {
  getLineChartOptionsAndPlugins,
  updateLineChartWithNewData,
} from "./LineChart";
import {
  getScatterChartOptionsAndPlugins,
  updateScatterChartWithNewData,
} from "./ScatterChart";

function _ChartArea({ sectionId }) {
  const { getRootProps, isDragActive } = useLoadArtifactViaDropzone(
    sectionId,
    false,
    "list",
  );

  return (
    <figure
      className={`section-w-full section-row-main single-cell-container flex h-auto w-full max-w-full items-center justify-items-center overflow-clip ${isDragActive ? "outline outline-4 outline-green-500 dark:outline-green-500/80" : ""}`}
      {...getRootProps()}
    >
      <ChartAreaCore sectionId={sectionId} />
    </figure>
  );
}

function _ChartAreaCore({ sectionId }) {
  const loadedArtifacts = useAllSectionArtifacts(sectionId, (x) =>
    _.pick(x, ["name", "value"]),
  );
  const [darkMode] = localStorageFns.darkMode.hook();
  const size = useSectionInfos((x) => x.x[sectionId].size, _.isEqual);
  const chartSettings = useSectionInfos(
    (x) => x.x[sectionId].chartSettings,
    _.isEqual,
  );
  const canvasRef = useRef();
  const chartRef = useRef(null);
  const [datasetHidden, setDatasetHidden] = useState({});

  useEffect(() => {
    const optionsAndPluginsFn = getOptionsAndPluginsFn(chartSettings.type);

    chartRef.current = new Chart(
      canvasRef.current,
      _.merge(
        {
          data: {
            datasets: [],
          },
          options: {
            animation: false,
            responsive: false,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: "linear",
                position: "bottom",
              },
              y1: {
                type: "linear",
                position: "left",
              },
              y2: {
                type: "linear",
                position: "right",
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
            plugins: {
              legend: {
                onClick: (evt, legendItem, legend) => {
                  setDatasetHidden((prev) => ({
                    ...prev,
                    [legendItem.text]: !prev[legendItem.text],
                  }));
                  Chart.defaults.plugins.legend.onClick(
                    evt,
                    legendItem,
                    legend,
                  );
                },
              },
            },
          },
        },
        optionsAndPluginsFn(),
      ),
    );

    chartRef.current.resize(size.width - 25, size.height - 50);

    const unsub = listenForCanvasToBase64Requests(sectionId, canvasRef);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      unsub();
    };
  }, [chartSettings.type]);

  useDeepCompareEffect(() => {
    const artifacts = Object.values(loadedArtifacts);
    if (!chartRef.current) {
      return;
    }

    const updateFn = getUpdaterFn(chartSettings.type);
    const newData = updateFn({
      chartRef,
      artifacts,
      datasetHidden,
      darkMode,
      chartSettings,
    });

    chartRef.current.data = newData;

    const scaleOptions = chartRef.current.options.scales;
    scaleOptions.x.type = getAxisType(
      chartSettings.xAxisLog,
      newData.labels?.[0],
    );
    scaleOptions.y1.type = getAxisType(chartSettings.y1AxisLog);
    scaleOptions.y2.type = getAxisType(chartSettings.y2AxisLog);
    scaleOptions.y2.display = chartSettings.secondYAxisColumns.length > 0;

    chartRef.current.resize(size.width - 25, size.height - 50);
    chartRef.current.update();
  }, [loadedArtifacts, size, datasetHidden, darkMode, chartSettings]);

  return <canvas ref={canvasRef} />;
}

const ChartAreaCore = React.memo(_ChartAreaCore);

export const ChartArea = React.memo(_ChartArea);

function getOptionsAndPluginsFn(type) {
  switch (type) {
    case "line":
      return getLineChartOptionsAndPlugins;
    case "scatter":
      return getScatterChartOptionsAndPlugins;
  }
}

function getUpdaterFn(type) {
  switch (type) {
    case "line":
      return updateLineChartWithNewData;
    case "scatter":
      return updateScatterChartWithNewData;
  }
}

function getAxisType(isLog, sampleData) {
  if (typeof sampleData === "string") {
    return "category";
  }
  return isLog ? "logarithmic" : "linear";
}
