import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useNavigate } from 'react-router-dom';
import Home from '../components/HomeComponent';
import { DeviceActions, ExperimentActions, PyodideActions } from '../actions';
import { RootState } from '../store';

function mapStateToProps(state: RootState) {
  return {
    ...state.device,
    ...state.pyodide,
    connectedDevice: state.device.connectedDevice ?? {},
    topoPlot: state.pyodide.topoPlot ?? {},
    signalQualityObservable: state.device.signalQualityObservable ?? undefined,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    DeviceActions: bindActionCreators(DeviceActions, dispatch),
    PyodideActions: bindActionCreators(PyodideActions, dispatch),
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

const ConnectedHome = connect(mapStateToProps, mapDispatchToProps)(Home);

function HomeContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedHome, { ...props, navigate });
}

export default HomeContainer;
