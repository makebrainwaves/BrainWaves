import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Design from '../components/DesignComponent';
import { ExperimentActions } from '../actions';
import { RootState } from '../store';
import { ExperimentParameters } from '../constants/interfaces';

function mapStateToProps(state: RootState) {
  return {
    ...state.experiment,
    params: state.experiment.params as ExperimentParameters,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

const ConnectedDesign = connect(mapStateToProps, mapDispatchToProps)(Design);

function ExperimentDesignContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedDesign, { ...props, navigate });
}

export default ExperimentDesignContainer;
