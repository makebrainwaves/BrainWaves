import * as ss from 'simple-statistics';

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
        ['RT_' + conditions[0]]: rtMean[conditions[0]],
        ['RT_' + conditions[1]]: rtMean[conditions[1]],
        ['Accuracy_' + conditions[0]]: accuracyPercent[conditions[0]],
        ['Accuracy_' + conditions[1]]: accuracyPercent[conditions[1]],
      }
    })
    return aggregatedData;
};

export const aggregateDataForPlot = (data, dependentVariable, removeOutliers, showDataPoints) => {
  const colors = ['#3D9970','#FF4136'];
  const isAggregated = data
    .filter(result => result.meta.datafile.split('/').pop().includes('aggregated'))
  if (isAggregated && isAggregated.length > 0){
    return displayAggregated(isAggregated, dependentVariable, showDataPoints, colors);
  } else {
    const filteredData = filterData(data, removeOutliers);
    const conditions = [... new Set(filteredData[0].map(row => row.condition))];
    switch (dependentVariable) {
      case "RT":
      default:
        return computeRT(filteredData, dependentVariable, conditions, showDataPoints, colors)
      case "Accuracy":
        return computeAccuracy(filteredData, dependentVariable, conditions, showDataPoints, colors)
    }
  }
};

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

const computeRT = (data, dependentVariable, conditions, showDataPoints, colors) => {
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.reduce((a, b) => a.concat(b), []).filter(e => e.condition === condition).map(r => r.reaction_time),
      x: data.reduce((a, b) => a.concat(b), []).filter(e => e.condition === condition).map(r => r.subject),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.2,
      marker: {
        size: 5
      },
      boxpoints: showDataPoints ? 'all' : 'false',
      pointpos: showDataPoints ? -1.5 : 0,
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable}`,
        zeroline: false,
        rangemode: 'tozero',
      },
    boxmode: 'group',
    title: `${dependentVariable}`
  };
  return {
    dataToPlot,
    layout
  }
}

const computeAccuracy = (data, dependentVariable, conditions, showDataPoints, colors) => {
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.map(d => d.filter(e => e.condition == condition && e.correct)).map(r => r.length / 1.5),
      x: data.map(d => d.filter(e => e.condition == condition && e.correct).map(r => r.subject)).map(a => a[0]),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.2,
      marker: {
        size: 5
      },
      boxpoints: showDataPoints ? 'all' : 'false',
      pointpos: showDataPoints ? -1.5 : 0,
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

const displayAggregated = (data, dependentVariable, showDataPoints, colors) => {
  const conditions = data.map(d => d.meta.fields.filter(f => f.includes('RT')).map(z => z.split('RT_')[1]))[0];
  switch (dependentVariable) {
    case "RT":
    default:
      return computeAggregatedRT(data, dependentVariable, conditions, showDataPoints, colors)
    case "Accuracy":
      return computeAggregatedAccuracy(data, dependentVariable, conditions, showDataPoints, colors)
  }
}

const computeAggregatedRT = (data, dependentVariable, conditions, showDataPoints, colors) => {
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.reduce((a, b) => a.concat(b.data.map(e=>parseFloat(e[`RT_${condition}`]))), []),
      x: data.reduce((a, b) => a.concat(b.data.map(e => {
        return b.meta.datafile.split('/').pop()
      })), []),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.2,
      marker: {
        size: 5
      },
      boxpoints: showDataPoints ? 'all' : 'false',
      pointpos: showDataPoints ? -1.5 : 0,
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable}`,
        zeroline: false,
        rangemode: 'tozero',
      },
    boxmode: 'group',
    title: `${dependentVariable}`
  };
  return {
    dataToPlot,
    layout
  }
}

const computeAggregatedAccuracy = (data, dependentVariable, conditions, showDataPoints, colors) => {
  const dataToPlot = conditions.map((condition,i) => {
    return {
      y: data.reduce((a, b) => a.concat(b.data.map(e=>parseFloat(e[`Accuracy_${condition}`]))), []),
      x: data.reduce((a, b) => a.concat(b.data.map(e => {
        return b.meta.datafile.split('/').pop()
      })), []),
      name: condition,
      marker: {color: colors[i]},
      type: 'box',
      jitter: 0.2,
      marker: {
        size: 5
      },
      boxpoints: showDataPoints ? 'all' : 'false',
      pointpos: showDataPoints ? -1.5 : 0,
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
