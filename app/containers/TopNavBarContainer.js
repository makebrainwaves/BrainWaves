// @flow
import { connect } from "react-redux";
import TopNavBar from "../components/TopNavComponent";

function mapStateToProps(state) {
  return {
    location: state.router.location,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    connectionStatus: state.device.connectionStatus,
    rawObservable: state.device.rawObservable,
    kernelStatus: state.jupyter.kernelStatus
  };
}

export default connect(mapStateToProps)(TopNavBar);
