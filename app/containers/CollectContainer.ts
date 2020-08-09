import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Collect from '../components/CollectComponent';
import { DeviceActions, ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    ...state.device,
    ...state.experiment,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Collect);
