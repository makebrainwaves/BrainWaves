// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Connect from "../components/ConnectComponent";
import * as deviceActions from "../actions/deviceActions";

function mapStateToProps(state) {
  return {
    ...state.device
  };
}

function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Connect);
