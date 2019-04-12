// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Analyze from '../components/AnalyzeComponent';
import * as experimentActions from '../actions/experimentActions';
import * as pyodideActions from '../actions/pyodideActions';

function mapStateToProps(state) {
  return {
    title: state.experiment.title,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    isEEGEnabled: state.experiment.isEEGEnabled,
    ...state.pyodide
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch),
    pyodideActions: bindActionCreators(pyodideActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Analyze);
