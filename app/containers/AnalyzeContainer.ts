import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Analyze from '../components/AnalyzeComponent';
import { JupyterActions, ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    title: state.experiment.title,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    isEEGEnabled: state.experiment.isEEGEnabled,
    ...state.jupyter
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    JupyterActions: bindActionCreators(JupyterActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Analyze);
