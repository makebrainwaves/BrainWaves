import * as ss from 'simple-statistics';

export const aggregateBehaviorDataToSave = (data, removeOutliers) => {
  const processedData = data.map(result => {
    if (result.meta.datafile.split('/').pop().includes('aggregated')){
      return transformAggregated(result)
    } else {
      return filterData(result, removeOutliers)
    }
  });
  const aggregatedData = processedData
    .map(e => {
      const conditionsArray = e.map(row => row.condition);
      const conditions = [... new Set(conditionsArray)];
      let rtMean = {}, accuracyPercent = {};
      for(let condition of conditions){
        let rt = e
          .filter(row =>  row.response_given === 'yes')
          .filter(row => row.correct_response === 'true')
          .filter(row => row.condition === condition)
          .map(row => row.reaction_time)
          .map(value => parseFloat(value))
        rtMean[condition] =  Math.round(ss.mean(rt));
        let accuracy = e
          .filter(row => row.condition === condition && row.correct_response === 'true' && row.response_given === 'yes')
        accuracyPercent[condition] = accuracy.length ? Math.round(100 * (accuracy.length / e.filter(r => r.condition === condition ).length)) : ss.mean(e.filter(r => r.condition === condition).map(r => r.accuracy));
      }
      return {
        subject: e.map(r => r.subject)[0],
        session: e.map(r => r.session)[0],
        ['RT_' + conditions[0]]: rtMean[conditions[0]],
        ['RT_' + conditions[1]]: rtMean[conditions[1]],
        ['Accuracy_' + conditions[0]]: accuracyPercent[conditions[0]],
        ['Accuracy_' + conditions[1]]: accuracyPercent[conditions[1]],
        response_given: 'yes',
        correct_response: 'true'
      }
    })
    return aggregatedData;
};

export const aggregateDataForPlot = (data, dependentVariable, removeOutliers, showDataPoints, displayMode) => {
  if(data && data.length > 0){
    const processedData = data.map(result => {
      if (result.meta.datafile.split('/').pop().includes('aggregated')){
        return transformAggregated(result)
      } else {
        return filterData(result, removeOutliers)
      }
    });
    const colors = ['#28619E','#3DBBDB'];
    const conditions = [... new Set(processedData[0].map(row => row.condition))];
    switch (dependentVariable) {
      case "RT":
      default:
        return computeRT(processedData, dependentVariable, conditions, showDataPoints, colors, displayMode)
      case "Accuracy":
        return computeAccuracy(processedData, dependentVariable, conditions, showDataPoints, colors, displayMode)
    }
  }
};

const transformAggregated = (result) => {
  const conditions = result.meta.fields.filter(field => field.startsWith('RT_')).map(c => c.split('RT_')[1]);
  const transformed = conditions.map((condition,i) => {
    return result.data.map(e => {
      return {
        reaction_time: parseFloat(e[`RT_${condition}`]),
        subject: result.meta.datafile.split('/').pop().split('.csv')[0],
        condition: condition,
        session: e.session,
        accuracy: parseFloat(e[`Accuracy_${condition}`]),
        response_given: e.response_given,
        correct_response: e.correct_response
      }
    })
  });
  const data = transformed.reduce( (acc, item) => acc.concat(item), []);
  return data
}

const filterData = (data, removeOutliers) => {
  let filteredData = data.data
      .filter(row => row.trial_number)
      .map(row => {
        return {
          condition: row.condition,
          subject: data.meta.datafile.split('/').pop().split('-')[0],
          session: data.meta.datafile.split('/').pop().split('-')[1],
          reaction_time: parseFloat(row.reaction_time),
          correct_response: row.correct_response,
          trial_number: row.trial_number,
          response_given: row.response_given
        }
      })
      // .filter(row => row.reaction_time > 0 && row.correct)
  if(removeOutliers){
    const mean = ss.mean(filteredData.filter(r => r.response_given === 'yes' && r.correct_response === 'true').map(r => r.reaction_time));
    const standardDeviation = ss.sampleStandardDeviation(filteredData.filter(r => r.response_given === 'yes' && r.correct_response === 'true').map(r => r.reaction_time));
    const upperBoarder = mean + 2 * standardDeviation;
    const lowerBoarder = mean - 2 * standardDeviation;
    filteredData = filteredData.filter(r => (r.reaction_time > lowerBoarder && r.reaction_time < upperBoarder) || isNaN(r.reaction_time));
  }
  return filteredData;
}

const computeRT = (data, dependentVariable, conditions, showDataPoints, colors, displayMode) => {
  let dataToPlot, maxValue = 0;
  switch (displayMode) {
    case "datapoints":
    default:
      let tickValuesX, tickTextX;
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const xRaw = data.reduce((a, b) => a.concat(b), []).filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition === condition).map(r => r.subject);
        const y = data.reduce((a, b) => a.concat(b), []).filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition === condition).map(r => r.reaction_time);
        maxValue = Math.max(...y) > maxValue ? Math.max(...y) : maxValue;
        const subjects = Array.from(new Set(xRaw))
        const x = xRaw.map(x => (subjects.indexOf(x) + 1 + i/4 + (Math.random() - 0.5)/5 ));
        tickValuesX = subjects.map(x => subjects.indexOf(x) + 1 + 1/8);
        tickTextX = subjects;
        obj[condition] = { x: x, y: y };
        return obj;
      }, {})
      dataToPlot['tickvals'] = tickValuesX;
      dataToPlot['ticktext'] = tickTextX;
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = maxValue > 1000 ? maxValue + 100 : 1000;
      return makeDataPointsGraph(dataToPlot, conditions, colors, dependentVariable)

    case "errorbars":
      let maxValueSE = 0;
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const xRaw = data.reduce((a, b) => a.concat(b), []).filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition === condition).map(r => r.subject);
        const x = Array.from(new Set(xRaw))
        const data_condition = data.map(d => d.filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition == condition));
        const y_bars_prep = x.map(
          a => data_condition.map(
            d => {return d.filter(e => e.subject === a)}
          ).filter(d => d.length > 0)
        );
        const y = y_bars_prep.map(y => ss.mean(y.reduce((a, b) => a.concat(b), []).map(r => r.reaction_time)));
        maxValue = Math.max(...y) > maxValue ? Math.max(...y) : maxValue;
        const stErrorFunction = (array) => {return ss.sampleStandardDeviation(array) / Math.sqrt(array.length)};
        const stErrors = data_condition.map(a => a.length  > 1 ? stErrorFunction(a.map(r => r.reaction_time)) : 0);
        maxValueSE = Math.max(...stErrors) > maxValueSE ? Math.max(...stErrors) : maxValueSE;
        obj[condition] = { x: x, y: y, stErrors: stErrors };
        return obj;
      }, {})
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = maxValue > 1000 ? maxValue + maxValueSE + 100 : 1000;
      return makeBarGraph(dataToPlot, conditions, colors, dependentVariable)

    case "whiskers":
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const x = data.reduce((a, b) => a.concat(b), []).filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition === condition).map(r => r.subject);
        const y = data.reduce((a, b) => a.concat(b), []).filter(r => r.response_given === 'yes' && r.correct_response === 'true').filter(e => e.condition === condition).map(r => r.reaction_time);
        maxValue = Math.max(...y) > maxValue ? Math.max(...y) : maxValue;
        obj[condition] = { x: x, y: y };
        return obj;
      }, {})
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = maxValue > 1000 ? maxValue + 100 : 1000;
      return makeBoxPlot(dataToPlot, conditions, colors, dependentVariable)
  }
}

const computeAccuracy = (data, dependentVariable, conditions, showDataPoints, colors, displayMode) => {
  let dataToPlot;

  switch (displayMode) {
    case "datapoints":
    default:
      let tickValuesX, tickTextX;
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const correctDataForCondition = data.map(d => d.filter(e => e.condition == condition));

        const y = correctDataForCondition.map(d => {
          if(d.filter(l => l.accuracy).length > 0){
            return d.map(l => l.accuracy)
          } else {
            const c = d.filter(e => e.response_given === 'yes' && e.correct_response === 'true')
            return Math.round((c.length / d.length) * 100)
          }
        }).reduce( (acc, item) => acc.concat(item), []);

        const xRaw = correctDataForCondition.map(d => {
          if(d.filter(l => l.accuracy).length > 0){
            return d.map(l => l.subject)
          } else {
            return d.map(r => r.subject)[0]
          }
        }).reduce( (acc, item) => acc.concat(item), []);
        const subjects = Array.from(new Set(xRaw))
        const x = xRaw.map(x => (subjects.indexOf(x) + 1 + i/4 + (Math.random() - 0.5)/5 ));
        tickValuesX = subjects.map(x => subjects.indexOf(x) + 1 + 1/8);
        tickTextX = subjects;
        obj[condition] = { x: x, y: y };
        return obj;
      }, {})
      dataToPlot['tickvals'] = tickValuesX;
      dataToPlot['ticktext'] = tickTextX;
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = 105;
      return makeDataPointsGraph(dataToPlot, conditions, colors, dependentVariable)

    case "errorbars":
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const correctDataForCondition = data.map(d => d.filter(e => e.condition == condition));
        const transformedData = correctDataForCondition.map(d => {
          if(d.filter(l => l.accuracy).length > 0){
            return d.map(l => {
              return ({
                accuracy: l.accuracy,
                subject: l.subject,
              })
            })
          } else {
            const c = d.filter(e => e.response_given === 'yes' && e.correct_response === 'true');
            return ({
              accuracy: Math.round((c.length / d.length) * 100),
              subject: d.map(r => r.subject)[0],
            })
          }
        }).reduce( (acc, item) => acc.concat(item), []);
        const subjects = Array.from(new Set(transformedData.map(e => e.subject)));
        const y = subjects.map(
          subject => ss.mean(transformedData.filter(e => e.subject === subject).map(d => d.accuracy))
        );
        const stErrorFunction = (array) => {return ss.sampleStandardDeviation(array) / Math.sqrt(array.length)};
        const stErrors = subjects.map(subject => {
          let array = transformedData.filter(e => e.subject === subject).map(d => d.accuracy);
          if(array.length > 1){
            return stErrorFunction(array);
          } else {
            return 0;
          }
        })
        obj[condition] = { x: subjects, y: y, stErrors: stErrors };
        return obj;
      }, {})
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = 105;
      return makeBarGraph(dataToPlot, conditions, colors, dependentVariable)

    case "whiskers":
      dataToPlot = conditions.reduce((obj, condition, i) => {
        const correctDataForCondition = data.map(d => d.filter(e => e.condition == condition));
        const y = correctDataForCondition.map(d => {
          if(d.filter(l => l.accuracy).length > 0){
            return d.map(l => l.accuracy)
          } else {
            const c = d.filter(e => e.response_given === 'yes' && e.correct_response === 'true')
            return Math.round((c.length / d.length) * 100)
          }
        }).reduce( (acc, item) => acc.concat(item), []);
        const xRaw = correctDataForCondition.map(d => {
          if(d.filter(l => l.accuracy).length > 0){
            return d.map(l => l.subject)
          } else {
            return d.map(r => r.subject)[0]
          }
        }).reduce( (acc, item) => acc.concat(item), []);
        obj[condition] = { x: xRaw, y: y };
        return obj;
      }, {})
      dataToPlot['lowerLimit'] = 0;
      dataToPlot['upperLimit'] = 105;
      return makeBoxPlot(dataToPlot, conditions, colors, dependentVariable)
  }
}

// Rendering functions
const makeDataPointsGraph = (data, conditions, colors, dependentVariable) => {
  let dataForCondition;
  let symbols = ['circle', 'cross', 'diamond', 'square'];
  const dataToPlot = conditions.map((condition,i) => {
    dataForCondition = data[condition];
    return {
      x: dataForCondition.x,
      y: dataForCondition.y,
      name: condition,
      type: 'scatter',
      marker: {
        color: colors[i],
        size: 7,
        symbol: symbols[i],
      },
      mode: 'markers',
    }
  })
  const layout = {
    xaxis: {
      tickvals: data.tickvals,
      ticktext: data.ticktext,
    },
    yaxis: {
      title: `${dependentVariable == 'Response Time' ? 'ms.' : '% correct'}`,
      range: [data.lowerLimit, data.upperLimit],
    },
    title: `${dependentVariable}`
  }
  return {
    dataToPlot,
    layout
  }
}

const makeBarGraph = (data, conditions, colors, dependentVariable) => {
  const dataToPlot = conditions.map((condition,i) => {
    const dataForCondition = data[condition];
    return {
      x: dataForCondition.x,
      y: dataForCondition.y,
      name: condition,
      type: 'bar',
      marker: {
        color: colors[i],
        size: 7
      },
      error_y: {
        type: 'data',
        array: dataForCondition.stErrors,
        visible: true
      },
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable == 'Response Time' ? 'ms.' : '% correct'}`,
        zeroline: false,
        range: [data.lowerLimit, data.upperLimit],
      },
    barmode: 'group',
    title: `${dependentVariable}`
  }
  return {
    dataToPlot,
    layout
  }
}

const makeBoxPlot = (data, conditions, colors, dependentVariable) => {
  let symbols = ['circle', 'cross', 'diamond', 'square'];
  const dataToPlot = conditions.map((condition,i) => {
    const dataForCondition = data[condition];
    return {
      x: dataForCondition.x,
      y: dataForCondition.y,
      name: condition,
      type: 'box',
      marker: {
        color: colors[i],
        size: 7,
        symbol: symbols[i],
      },
      boxpoints: 'false',
      pointpos: 0,
    }
  })
  const layout = {
    yaxis: {
        title: `${dependentVariable == 'Response Time' ? 'ms.' : '% correct'}`,
        zeroline: false,
        range: [data.lowerLimit, data.upperLimit],
      },
    boxmode: 'group',
    title: `${dependentVariable}`
  }
  return {
    dataToPlot,
    layout
  }
}
