import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import EEGExplorationComponent from '../components/EEGExplorationComponent';
import { DeviceActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    connectedDevice: state.device.connectedDevice,
    signalQualityObservable: state.device.signalQualityObservable ?? undefined,
    deviceType: state.device.deviceType,
    deviceAvailability: state.device.deviceAvailability,
    connectionStatus: state.device.connectionStatus,
    availableDevices: state.device.availableDevices,
    availableLSLStreams: state.device.availableLSLStreams,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EEGExplorationComponent);
