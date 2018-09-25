// @flow
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import TopNavComponent from '../components/TopNavComponent';
import * as experimentActions from '../actions/experimentActions';

function mapStateToProps(state) {
  return {
    location: state.router.location,
    title: state.experiment.title,
    type: state.experiment.type,
    deviceType: state.device.deviceType,
    connectionStatus: state.device.connectionStatus,
    rawObservable: state.device.rawObservable,
    kernelStatus: state.jupyter.kernelStatus
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TopNavComponent);
