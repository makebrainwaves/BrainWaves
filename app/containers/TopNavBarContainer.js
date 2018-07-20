// @flow
import { connect } from "react-redux";
import TopNavBar from "../components/TopNavComponent";

function mapStateToProps(state) {
  return {
    location: state.router.location,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    rawObservable: state.device.rawObservable,
    mainChannel: state.jupyter.mainChannel
  };
}

export default connect(mapStateToProps)(TopNavBar);
