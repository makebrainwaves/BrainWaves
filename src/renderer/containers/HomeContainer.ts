import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Home from '../components/HomeComponent';
import { DeviceActions, ExperimentActions, PyodideActions } from '../actions';
import { withRouter } from '../utils/withRouter';
import { RootState } from '../reducers';

function mapStateToProps(state: RootState) {
  return {
    ...state.device,
    connectedDevice: state.device.connectedDevice ?? {},
    rawObservable: state.device.rawObservable ?? undefined,
    signalQualityObservable: state.device.signalQualityObservable ?? undefined,
    // Pyodide state with nullable defaults
    epochsInfo: state.pyodide.epochsInfo,
    channelInfo: state.pyodide.channelInfo,
    psdPlot: state.pyodide.psdPlot ?? {},
    topoPlot: state.pyodide.topoPlot ?? {},
    erpPlot: state.pyodide.erpPlot ?? {},
    worker: state.pyodide.worker,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Home));
