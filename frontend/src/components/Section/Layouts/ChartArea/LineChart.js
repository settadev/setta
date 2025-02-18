import { Tooltip } from "chart.js";
import { processChartArtifacts } from "state/actions/artifacts";

Tooltip.positioners.lineChartTooltipMousePosition = function (
  elements,
  eventPosition,
) {
  return { x: eventPosition.x, y: eventPosition.y };
};

export function getLineChartOptionsAndPlugins() {
  return {
    type: "line",
    data: {
      datasets: [],
    },
    plugins: [verticalLinePlugin],
    options: {
      spanGaps: true,
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          position: "lineChartTooltipMousePosition",
          callbacks: {
            title: (context) => {
              return `X: ${context[0].label}`;
            },
            label: (context) => {
              const label = context.dataset.label || "";
              return `${label}: ${context.formattedValue}`;
            },
          },
        },
      },
    },
  };
}

export function updateLineChartWithNewData({
  chartRef,
  artifacts,
  datasetHidden,
  darkMode,
  chartSettings,
}) {
  const datasets = [];
  const artifactValue = processChartArtifacts(artifacts, "line");

  let labels = null;
  for (const [columnName, values] of Object.entries(artifactValue)) {
    if (columnName === chartSettings.xAxisColumn) {
      labels = values;
      continue;
    }
    datasets.push({
      label: columnName,
      data: values,
      yAxisID: chartSettings.secondYAxisColumns.includes(columnName)
        ? "y2"
        : "y1",
      hidden: datasetHidden[columnName],
    });
  }

  if (datasets.length > 0 && !labels) {
    // The xAxisColumn can be made empty in the side pane.
    // In this case, none of the columns are used for the x axis.
    // So we use row count.
    const numRows = datasets[0].data.length;
    labels = [...Array(numRows).keys()];
  }

  chartRef.current.verticalLinePlugin.color = darkMode ? "white" : "black";

  return { labels, datasets };
}

const verticalLinePlugin = {
  id: "verticalLinePlugin",
  afterInit: (chart) => {
    chart.verticalLinePlugin = {
      x: 0,
      y: 0,
      draw: false,
      width: 1,
      color: "black",
      dash: [3, 3],
    };
  },
  afterEvent: (chart, args) => {
    const { inChartArea } = args;
    const { x, y } = args.event;

    if (inChartArea) {
      // Find the nearest x-axis data point
      const xScale = chart.scales.x;
      const values = chart.data.labels;

      // Convert mouse x position to data space
      const mouseValue = xScale.getValueForPixel(x);

      // Find nearest data point
      let nearestValue = values[0];
      let minDistance = Math.abs(mouseValue - values[0]);

      for (const value of values) {
        const distance = Math.abs(mouseValue - value);
        if (distance < minDistance) {
          minDistance = distance;
          nearestValue = value;
        }
      }

      // Convert back to pixels for drawing
      const snapX = xScale.getPixelForValue(nearestValue);

      chart.verticalLinePlugin = {
        ...chart.verticalLinePlugin,
        x: snapX,
        y,
        draw: true,
      };
    } else {
      chart.verticalLinePlugin = {
        ...chart.verticalLinePlugin,
        x,
        y,
        draw: false,
      };
    }

    chart.draw();
  },
  beforeDatasetsDraw: (chart) => {
    const { ctx } = chart;
    const { top, bottom } = chart.chartArea;
    const { x, draw, width, color, dash } = chart.verticalLinePlugin;
    if (!draw) return;

    ctx.save();

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
    ctx.stroke();

    ctx.restore();
  },
};
