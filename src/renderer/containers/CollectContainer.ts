import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Collect from '../components/CollectComponent';
import { DeviceActions, ExperimentActions } from '../actions';
import { RootState } from '../store';
import { ExperimentParameters } from '../constants/interfaces';

function mapStateToProps(state: RootState) {
  return {
    ...state.device,
    ...state.experiment,
    connectedDevice: state.device.connectedDevice ?? {},
    signalQualityObservable: state.device.signalQualityObservable ?? undefined,
    params: state.experiment.params as ExperimentParameters,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Collect);
