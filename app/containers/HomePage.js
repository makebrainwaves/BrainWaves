// @flow
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Home from "../components/Home";
import * as deviceActions from "../actions/deviceActions";
import * as jupyterActions from "../actions/jupyterActions";

function mapStateToProps(state) {
  return {
    rawObservable: state.device.rawObservable,
    client: state.device.client,
    mainChannel: state.jupyter.mainChannel
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
