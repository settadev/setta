import { IdNameCombobox } from "components/Utils/Combobox/IdNameCombobox";
import C from "constants/constants.json";
import _ from "lodash";
import { updateColumnNameSelections } from "state/actions/artifacts";
import { useMisc, useSectionInfos } from "state/definitions";
import { getAllSectionArtifactIds } from "state/hooks/artifacts";
import { JustListOfArtifacts } from "./ListOfArtifacts";

export function ChartAreaSettings({ sectionId }) {
  return (
    <div className="flex-1 overflow-x-hidden overflow-y-scroll [&>*]:mr-[2px]">
      <ChartConfig sectionId={sectionId} />
      <JustListOfArtifacts sectionId={sectionId} sectionTypeName={C.CHART} />
    </div>
  );
}

function ChartConfig({ sectionId }) {
  const chartSettings = useSectionInfos(
    (x) => x.x[sectionId].chartSettings,
    _.isEqual,
  );

  const valueHeaders = useMisc(
    (x) => x.chartDisplayedSeriesNames[sectionId],
    _.isEqual,
  );

  return (
    <div className="flex flex-col gap-1">
      <h3 className="mt-1 font-bold text-setta-400 dark:text-setta-500">
        Chart Config
      </h3>
      <ChartTypeSelection
        sectionId={sectionId}
        selectedChartType={chartSettings.type}
      />
      <SpecificConfig
        sectionId={sectionId}
        chartSettings={chartSettings}
        valueHeaders={valueHeaders}
      />
    </div>
  );
}

function SpecificConfig({ sectionId, chartSettings, valueHeaders }) {
  switch (chartSettings.type) {
    case "line":
      return (
        <LineChartConfig
          sectionId={sectionId}
          chartSettings={chartSettings}
          valueHeaders={valueHeaders}
        />
      );
    case "scatter":
      return (
        <ScatterChartConfig
          sectionId={sectionId}
          chartSettings={chartSettings}
          valueHeaders={valueHeaders}
        />
      );
    default:
      return null;
  }
}

function LineChartConfig({ sectionId, chartSettings, valueHeaders }) {
  const optionsWithToggle = [
    { name: "xAxisLog", title: "X-Axis Log Scale" },
    { name: "y1AxisLog", title: "Y1-Axis Log Scale" },
    { name: "y2AxisLog", title: "Y2-Axis Log Scale" },
  ];

  return (
    <>
      <XAxisColumnSelection
        sectionId={sectionId}
        valueHeaders={valueHeaders}
        selectedXAxisColumn={chartSettings.xAxisColumn}
      />
      <TogglableOptions
        sectionId={sectionId}
        optionsWithToggle={optionsWithToggle}
        chartSettings={chartSettings}
      />
    </>
  );
}

function ScatterChartConfig({ sectionId, chartSettings, valueHeaders }) {
  const optionsWithToggle = [
    { name: "xAxisLog", title: "X-Axis Log Scale" },
    { name: "y1AxisLog", title: "Y1-Axis Log Scale" },
    { name: "y2AxisLog", title: "Y2-Axis Log Scale" },
  ];

  return (
    <>
      <XAxisColumnSelection
        sectionId={sectionId}
        valueHeaders={valueHeaders}
        selectedXAxisColumn={chartSettings.xAxisColumn}
      />
      <CategoryColumnSelection
        sectionId={sectionId}
        valueHeaders={valueHeaders}
        selectedCategoryColumn={chartSettings.categoryColumn}
      />
      <TogglableOptions
        sectionId={sectionId}
        optionsWithToggle={optionsWithToggle}
        chartSettings={chartSettings}
      />
    </>
  );
}

function ChartTypeSelection({ sectionId, selectedChartType }) {
  return (
    <>
      <label
        htmlFor="chartType"
        className="block text-xs font-medium text-setta-700 dark:text-setta-300"
      >
        Chart Type
      </label>
      <IdNameCombobox
        allItems={chartTypes}
        value={selectedChartType}
        onSelectedItemChange={(v) => setChartType(sectionId, v)}
      />
    </>
  );
}

function XAxisColumnSelection({
  sectionId,
  valueHeaders,
  selectedXAxisColumn,
}) {
  const xAxisColumnChoices = [
    {
      group: "Column Names",
      items: valueHeaders?.map((x) => ({ id: x, name: x })) ?? [],
    },
  ];

  return (
    <>
      <label
        htmlFor="xAxisColumn"
        className="block text-xs font-medium text-setta-700 dark:text-setta-300"
      >
        X-Axis Column
      </label>
      <IdNameCombobox
        allItems={xAxisColumnChoices}
        value={selectedXAxisColumn}
        onSelectedItemChange={(v) =>
          setChartSetting(sectionId, "xAxisColumn", v)
        }
      />
    </>
  );
}

function CategoryColumnSelection({
  sectionId,
  valueHeaders,
  selectedCategoryColumn,
}) {
  const categoryColumnChoices = [
    {
      group: "Column Names",
      items: valueHeaders?.map((x) => ({ id: x, name: x })) ?? [],
    },
  ];

  return (
    <>
      <label
        htmlFor="categoryColumn"
        className="block text-xs font-medium text-setta-700 dark:text-setta-300"
      >
        Category Column
      </label>
      <IdNameCombobox
        allItems={categoryColumnChoices}
        value={selectedCategoryColumn}
        onSelectedItemChange={(v) =>
          setChartSetting(sectionId, "categoryColumn", v)
        }
      />
    </>
  );
}

function TogglableOptions({ sectionId, optionsWithToggle, chartSettings }) {
  return (
    <div className="flex flex-col gap-2 py-6">
      <h4 className="font-semibold text-setta-400 dark:text-setta-400">
        Chart Labels
      </h4>
      {optionsWithToggle.map((x) => (
        <ChartConfigToggle
          key={`${x.name}`}
          sectionId={sectionId}
          name={x.name}
          title={x.title}
          value={chartSettings[x.name]}
        />
      ))}
    </div>
  );
}

function ChartConfigToggle({ sectionId, name, value, title }) {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={name}
        className="cursor-pointer text-xs font-medium text-setta-700 dark:text-setta-300"
      >
        {title}
      </label>
      <input
        type="checkbox"
        id={name}
        className="h-4 w-4 cursor-pointer rounded bg-setta-500/50  text-blue-500 outline outline-offset-2 outline-transparent checked:bg-blue-500 focus-visible:!outline-blue-500 dark:text-blue-400 dark:focus-visible:ring-blue-400"
        checked={value}
        onChange={(e) => setChartSetting(sectionId, name, e.target.checked)}
      />
    </div>
  );
}

function setChartSetting(sectionId, name, value) {
  useSectionInfos.setState((state) => {
    state.x[sectionId].chartSettings[name] = value;
  });
}

function setChartType(sectionId, chartType) {
  useSectionInfos.setState((state) => {
    state.x[sectionId].chartSettings.type = chartType;
    const artifactIds = getAllSectionArtifactIds(sectionId, state);
    updateColumnNameSelections(Array.from(artifactIds), sectionId, state);
  });
}

const chartTypes = [
  {
    group: "Chart Types",
    items: ["line", "scatter"].map((x) => ({ id: x, name: x })),
  },
];
