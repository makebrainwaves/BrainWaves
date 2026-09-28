import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Analyze from '../components/AnalyzeComponent';
import { PyodideActions, ExperimentActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    title: state.experiment.title,
    isEEGEnabled: state.experiment.isEEGEnabled,
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

const ConnectedAnalyze = connect(mapStateToProps, mapDispatchToProps)(Analyze);

export default function AnalyzeContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedAnalyze, { ...props, navigate });
}
