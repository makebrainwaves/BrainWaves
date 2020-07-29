import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Design from '../components/DesignComponent';
import { ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    ...state.experiment
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Design);
