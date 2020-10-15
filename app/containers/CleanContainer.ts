import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CleanComponent from '../components/CleanComponent';
import { PyodideActions, ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    type: state.experiment.type,
    title: state.experiment.title,
    subject: state.experiment.subject,
    group: state.experiment.group,
    session: state.experiment.session,
    deviceType: state.device.deviceType,
    ...state.pyodide,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CleanComponent);
