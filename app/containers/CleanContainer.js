// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CleanComponent from '../components/CleanComponent';
import * as experimentActions from '../actions/experimentActions';
import * as pyodideActions from '../actions/pyodideActions';

function mapStateToProps(state) {
  return {
    type: state.experiment.type,
    title: state.experiment.title,
    subject: state.experiment.subject,
    group: state.experiment.group,
    session: state.experiment.session,
    deviceType: state.device.deviceType,
    ...state.pyodide
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch),
    pyodideActions: bindActionCreators(pyodideActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CleanComponent);
