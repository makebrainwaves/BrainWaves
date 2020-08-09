import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import TopNavComponent from '../components/TopNavComponent';
import { ExperimentActions } from '../actions';

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
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TopNavComponent);
