import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Collect from '../components/CollectComponent';
import { DeviceActions, ExperimentActions } from '../actions';
import { withRouter } from '../utils/withRouter';
import { RootState } from '../reducers';

function mapStateToProps(state: RootState) {
  return {
    ...state.device,
    connectedDevice: state.device.connectedDevice ?? {},
    rawObservable: state.device.rawObservable ?? undefined,
    signalQualityObservable:
      state.device.signalQualityObservable ?? (undefined as any),
    ...state.experiment,
    params: state.experiment.params ?? ({} as any),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Collect)
);
