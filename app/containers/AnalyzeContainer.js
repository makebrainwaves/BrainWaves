// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Analyze from "../components/AnalyzeComponent";
import * as experimentActions from "../actions/experimentActions";
import * as jupyterActions from "../actions/jupyterActions";

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
    experimentActions: bindActionCreators(experimentActions, dispatch),
    jupyterActions: bindActionCreators(jupyterActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Analyze);
