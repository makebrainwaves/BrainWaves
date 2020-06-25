import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Design from '../components/DesignComponent';
import * as experimentActions from '../actions/experimentActions';

function mapStateToProps(state) {
  return {
    ...state.experiment
  };
}

function mapDispatchToProps(dispatch) {
  return {
    experimentActions: bindActionCreators(experimentActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Design);
