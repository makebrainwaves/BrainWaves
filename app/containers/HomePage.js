// @flow
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Home from "../components/Home";
import * as counterActions from "../actions/counter";
import * as jupyterActions from "../actions/jupyter";

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    counterActions: bindActionCreators(counterActions, dispatch),
    jupyterActions: bindActionCreators(jupyterActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
