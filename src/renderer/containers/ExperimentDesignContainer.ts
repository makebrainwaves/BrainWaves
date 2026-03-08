import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Design from '../components/DesignComponent';
import { ExperimentActions } from '../actions';
import { withRouter } from '../utils/withRouter';
import { RootState } from '../reducers';

function mapStateToProps(state: RootState) {
  return {
    ...state.experiment,
    // provide empty-object default: DesignProps.params is non-nullable
    params: state.experiment.params ?? ({} as any),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Design));
