// @flow
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Home from "../components/Home";
import * as deviceActions from "../actions/deviceActions";
import * as jupyterActions from "../actions/jupyterActions";

function mapStateToProps(state) {
  return {
    rawObservable: state.device.rawObservable
  };
}

function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch),
    jupyterActions: bindActionCreators(jupyterActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
