// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Run from "../components/RunComponent";
import * as experimentActions from "../actions/experimentActions";
import * as deviceActions from "../actions/deviceActions";

function mapStateToProps(state) {
  return {
    ...state.experiment,
    deviceType: state.device.deviceType,
    client: state.device.client
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
)(Run);
