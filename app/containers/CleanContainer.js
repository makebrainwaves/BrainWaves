// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import CleanComponent from "../components/CleanComponent";
import * as experimentActions from "../actions/experimentActions";
import * as jupyterActions from "../actions/jupyterActions";

function mapStateToProps(state) {
  return {
    type: state.experiment.type,
    title: state.experiment.title,
    deviceType: state.device.deviceType,
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
)(CleanComponent);
