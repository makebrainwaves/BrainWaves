import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import EEGExplorationComponent from '../components/EEGExplorationComponent';
import { DeviceActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    connectedDevice: state.device.connectedDevice,
    signalQualityObservable: state.device.signalQualityObservable ?? undefined,
    connectionStatus: state.device.connectionStatus,
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
