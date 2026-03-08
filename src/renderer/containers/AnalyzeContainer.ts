import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Analyze from '../components/AnalyzeComponent';
import { PyodideActions, ExperimentActions } from '../actions';
import { RootState } from '../reducers';

function mapStateToProps(state: RootState) {
  return {
    title: state.experiment.title,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    isEEGEnabled: state.experiment.isEEGEnabled,
    epochsInfo: state.pyodide.epochsInfo,
    channelInfo: state.pyodide.channelInfo,
    // Provide empty-object defaults: component expects non-nullable records
    psdPlot: state.pyodide.psdPlot ?? {},
    topoPlot: state.pyodide.topoPlot ?? {},
    erpPlot: state.pyodide.erpPlot ?? {},
    worker: state.pyodide.worker,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Analyze);
