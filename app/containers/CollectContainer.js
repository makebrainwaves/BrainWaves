// @flow
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Collect from "../components/CollectComponent";
import * as deviceActions from "../actions/deviceActions";
import * as experimentActions from "../actions/experimentActions";

function mapStateToProps(state) {
  return {
    ...state.device,
    ...state.experiment
  };
}

function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch),
    experimentActions: bindActionCreators(experimentActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Collect);
