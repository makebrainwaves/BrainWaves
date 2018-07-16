// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import ExperimentRun from "../components/ExperimentRun";
import * as experimentActions from "../actions/experimentActions";
import * as deviceActions from "../actions/deviceActions";

function mapStateToProps(state) {
  return {
    ...state.experiment
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch),
    deviceActions: bindActionCreators(deviceActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ExperimentRun);
