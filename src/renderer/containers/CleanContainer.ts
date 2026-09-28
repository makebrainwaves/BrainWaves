import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CleanComponent from '../components/CleanComponent';
import { PyodideActions, ExperimentActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    title: state.experiment.title,
    group: state.experiment.group,
    params: state.experiment.params,
    ...state.pyodide,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
  };
}

const ConnectedClean = connect(
  mapStateToProps,
  mapDispatchToProps
)(CleanComponent);

export default function CleanContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedClean, { ...props, navigate });
}
