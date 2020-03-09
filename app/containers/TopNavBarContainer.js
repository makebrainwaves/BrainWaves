// @flow
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import TopNavComponent from '../components/TopNavComponent';
import * as experimentActions from '../actions/experimentActions';

function mapStateToProps(state) {
  return {
    title: state.experiment.title,
    location: state.router.location,
    isRunning: state.experiment.isRunning,
    type: state.experiment.type,
    isEEGEnabled: state.experiment.isEEGEnabled,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TopNavComponent);
