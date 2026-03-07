import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Design from '../components/DesignComponent';
import { ExperimentActions } from '../actions';

function mapStateToProps(state) {
  return {
    ...state.experiment,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

const ConnectedDesign = connect(mapStateToProps, mapDispatchToProps)(Design);

function ExperimentDesignContainer(props: any) {
  const navigate = useNavigate();
  return React.createElement(ConnectedDesign, { ...props, navigate });
}

export default ExperimentDesignContainer;
