import * as ss from 'simple-statistics';

const filterData = (data, removeOutliers) => {
  let filteredData = data
    .map(result => result.data
      .map(row => {
        return {
          condition: row.event_title,
          subject: result.meta.datafile.split('/').pop().split('-')[0],
          session: result.meta.datafile.split('/').pop().split('-')[1],
          reaction_time: parseFloat(row.reaction_time),
          correct: row.correct === 'true',
        }
      })
      .filter(row => row.reaction_time > 0 && row.correct)
    )
  if(removeOutliers){
    filteredData = filteredData
      .map(dataset => {
        const mean = ss.mean(dataset.map(r => r.reaction_time));
        const standardDeviation = ss.sampleStandardDeviation(dataset.map(r => r.reaction_time));
        const upperBoarder = mean + 2 * standardDeviation;
        const lowerBoarder = mean - 2 * standardDeviation;
        const filteredDataset = dataset.filter(r => r.reaction_time > lowerBoarder && r.reaction_time < upperBoarder);
        return filteredDataset;
      })
  }
  return filteredData;
}

export const aggregateBehaviorDataToSave = (data, removeOutliers) => {
  const filteredData = filterData(data, removeOutliers);
  const aggregatedData = filteredData
    .map(e => {
      const conditionsArray = e.map(row => row.condition);
      const conditions = [... new Set(conditionsArray)];
      let rtMean = {}, accuracyPercent = {};
      for(let condition of conditions){
        let rt = e
          .filter(row => row.condition === condition)
          .map(row => row.reaction_time)
          .map(value => parseFloat(value))
        rtMean[condition] =  ss.mean(rt);
        let accuracy = e
          .filter(row => row.condition === condition)
          .map(row => row.correct)
        accuracyPercent[condition] = accuracy.length / 1.5;
      }
      return {
        subject: e.map(r => r.subject)[0],
        session: e.map(r => r.session)[0],
        RT_condition1: rtMean[conditions[0]],
        RT_condition2: rtMean[conditions[1]],
        Accuracy_condition1: accuracyPercent[conditions[0]],
        Accuracy_condition2: accuracyPercent[conditions[1]],
      }
    })
    return aggregatedData;
};

export const aggregateDataForPlot = (data, dependentVariable, removeOutliers) => {
  const filteredData = filterData(data, removeOutliers);
  const conditions = [... new Set(filteredData[0].map(row => row.condition))];
  switch (dependentVariable) {
    case "RT":
    default:
      return computeRT(filteredData, dependentVariable, conditions)
    case "Accuracy":
      return computeAccuracy(filteredData, dependentVariable, conditions)
  }
};

const computeRT = (data, dependentVariable, conditions) => {
  const colors = ['#3D9970','#FF4136'];
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.reduce((a, b) => a.concat(b), []).filter(e => e.condition === condition).map(r => r.reaction_time),
      x: data.reduce((a, b) => a.concat(b), []).filter(e => e.condition === condition).map(r => r.subject),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.3,
      boxpoints: 'all',
      pointpos: -1.5,
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable}`,
        zeroline: false,
        range: [0, 760],
      },
    boxmode: 'group',
    title: `${dependentVariable}`
  };
  return {
    dataToPlot,
    layout
  }
}

const computeAccuracy = (data, dependentVariable, conditions) => {
  const colors = ['#3D9970','#FF4136'];
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.map(d => d.filter(e => e.condition == condition && e.correct)).map(r => r.length / 1.5),
      x: data.map(d => d.filter(e => e.condition == condition && e.correct).map(r => r.subject)).map(a => a[0]),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.3,
      boxpoints: 'all',
      pointpos: -1.5,
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable}`,
        zeroline: false,
        range: [0, 100],
      },
    boxmode: 'group',
    title: `${dependentVariable}`
  };
  return {
    dataToPlot,
    layout
  }
}
