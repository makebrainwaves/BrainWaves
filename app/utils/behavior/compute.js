import * as ss from 'simple-statistics';

export const aggregateData = (rawData, dv, files) => {
  const names = files.map(name => name.split('/').pop().split('-behavior.csv')[0]);
  // pre-processing of raw data that is similar for all dependent variables
  const filteredData = rawData
    .map(result => result.data
      .filter(row => row.reaction_time > 0))

  switch (dv) {
    case "RT":
    default:
      return computeRT(filteredData, dv, names)
    case "Accuracy":
      return computeAccuracy(filteredData, dv, names)
  }
};


const computeRT = (data, dv, names) => {
  const aggregatedData = data
    .map(result => result
      .map(row => parseFloat(row.reaction_time)))
    .map(rt => getStatistics(rt))
  const dataToPlot = [
    {
      x: names,
      y: aggregatedData.map(rt => rt.means),
      error_y: {
        type: 'data',
        array: aggregatedData.map(rt => rt.standardErrors),
        visible: true,
      },
      type: 'bar',
    }
  ];
  const layout = { title: `${dv}`, barmode: 'group' };
  return {
    dataToPlot,
    layout
  }
}

const computeAccuracy = (data, dv, names) => {
  const correctResponsesSum = data
    .map(result => result
      .map(row => row.correct)
      .filter(i => i === 'true'))
    .map(rt => rt.length)
    const dataToPlot = [
      {
        x: names,
        y: correctResponsesSum,
        type: 'bar',
      }
    ];
    const layout = { title: `${dv}` };
    return {
      dataToPlot,
      layout
    }
}

const getStatistics = (rawData) => {
  const means = ss.mean(rawData);
  const sampleStandardDeviations = ss.sampleStandardDeviation(rawData);
  const standardErrors = sampleStandardDeviations/(Math.sqrt(rawData.length))
  return {
    means,
    sampleStandardDeviations,
    standardErrors
  };
};
