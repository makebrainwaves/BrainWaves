import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Collect from '../components/CollectComponent';
import { DeviceActions, ExperimentActions } from '../actions';
import { withRouter } from '../utils/withRouter';

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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Collect) as any);
