import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CleanComponent from '../components/CleanComponent';
import { PyodideActions, ExperimentActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    type: state.experiment.type,
    title: state.experiment.title,
    subject: state.experiment.subject,
    group: state.experiment.group,
    session: state.experiment.session,
    params: state.experiment.params,
    deviceType: state.device.deviceType,
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
