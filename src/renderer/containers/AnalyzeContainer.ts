import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Analyze from '../components/AnalyzeComponent';
import { PyodideActions, ExperimentActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    title: state.experiment.title,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    isEEGEnabled: state.experiment.isEEGEnabled,
    ...state.pyodide,
    psdPlot: state.pyodide.psdPlot ?? {},
    topoPlot: state.pyodide.topoPlot ?? {},
    erpPlot: state.pyodide.erpPlot ?? {},
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Analyze);
