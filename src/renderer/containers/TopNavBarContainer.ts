import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useLocation } from 'react-router-dom';
import TopNavComponent from '../components/TopNavComponent';
import { ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    title: state.experiment.title,
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

const Connected = connect(mapStateToProps, mapDispatchToProps)(TopNavComponent);

// Inject `location` from React Router via a functional wrapper
function TopNavBarContainer(props: object) {
  const location = useLocation();
  return React.createElement(Connected, { ...props, location } as any);
}

export default TopNavBarContainer;
