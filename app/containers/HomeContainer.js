// @flow
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Home from '../components/HomeComponent';
import * as deviceActions from '../actions/deviceActions';
import * as jupyterActions from '../actions/jupyterActions';
import * as experimentActions from '../actions/experimentActions';

function mapStateToProps(state) {
  return {
    kernelStatus: state.jupyter.kernelStatus
  };
}

function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch),
    jupyterActions: bindActionCreators(jupyterActions, dispatch),
    experimentActions: bindActionCreators(experimentActions, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
