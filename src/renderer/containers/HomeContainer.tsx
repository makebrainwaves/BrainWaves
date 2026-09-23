import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useNavigate } from 'react-router-dom';
import HomeScreen from '../components/HomeLanding/HomeScreen';
import { ExperimentActions, PyodideActions } from '../actions';

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
  };
}

const ConnectedHomeScreen = connect(null, mapDispatchToProps)(HomeScreen);

function HomeContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedHomeScreen, { ...props, navigate });
}

export default HomeContainer;
