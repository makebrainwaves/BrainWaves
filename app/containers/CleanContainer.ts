import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CleanComponent from '../components/CleanComponent';
import { JupyterActions, ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    type: state.experiment.type,
    title: state.experiment.title,
    subject: state.experiment.subject,
    group: state.experiment.group,
    session: state.experiment.session,
    deviceType: state.device.deviceType,
    ...state.jupyter,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    JupyterActions: bindActionCreators(JupyterActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CleanComponent);
