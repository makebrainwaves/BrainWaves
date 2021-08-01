import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Home from '../components/HomeComponent';
import { DeviceActions, ExperimentActions, PyodideActions } from '../actions';

function mapStateToProps(state) {
  return {
    ...state.device,
    ...state.pyodide,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
