import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Home from '../components/HomeComponent';
import { DeviceActions, ExperimentActions, JupyterActions } from '../actions';

function mapStateToProps(state) {
  return {
    ...state.device,
    kernelStatus: state.jupyter.kernelStatus,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    JupyterActions: bindActionCreators(JupyterActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
