// @flow
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Home from "../components/HomeComponent";
import * as deviceActions from "../actions/deviceActions";
import * as pyodideActions from "../actions/pyodideActions";
import * as experimentActions from "../actions/experimentActions";

function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch),
    pyodideActions: bindActionCreators(pyodideActions, dispatch),
    experimentActions: bindActionCreators(experimentActions, dispatch)
  };
}

export default connect(
  null,
  mapDispatchToProps
)(Home);
