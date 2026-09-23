import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useNavigate } from 'react-router-dom';
import Home from '../components/HomeComponent';
import { ExperimentActions } from '../actions';

function mapDispatchToProps(dispatch) {
  return {
    ExperimentActions: bindActionCreators(ExperimentActions, dispatch),
  };
}

const ConnectedBank = connect(null, mapDispatchToProps)(Home);

function BankContainer(props: Record<string, unknown>) {
  const navigate = useNavigate();
  return React.createElement(ConnectedBank, { ...props, navigate });
}

export default BankContainer;
