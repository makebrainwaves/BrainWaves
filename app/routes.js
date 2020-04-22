/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomeContainer from './containers/HomeContainer';
import ExperimentDesignContainer from './containers/ExperimentDesignContainer';
import CollectContainer from './containers/CollectContainer';
import CleanContainer from './containers/CleanContainer';
import AnalyzeContainer from './containers/AnalyzeContainer';
import { SCREENS } from './constants/constants';

const renderMergedProps = (component, ...rest) => {
  const finalProps = Object.assign({}, ...rest);
  return (
    React.createElement(component, finalProps)
  );
}

const PropsRoute = ({ component, ...rest }) => (
  <Route
    {...rest}
    render={routeProps => renderMergedProps(component, routeProps, rest)}
  />
  )

export default () => (
  <App>
    <Switch>
      <Route path={SCREENS.ANALYZE.route} component={AnalyzeContainer} />
      <Route path={SCREENS.CLEAN.route} component={CleanContainer} />
      <Route path={SCREENS.COLLECT.route} component={CollectContainer} />
      <Route path={SCREENS.DESIGN.route} component={ExperimentDesignContainer} />
      <PropsRoute path='/home' component={HomeContainer} activeStep="EXPERIMENT BANK" />
      <PropsRoute path='/' component={HomeContainer} activeStep="MY EXPERIMENTS" />
    </Switch>
  </App>
);
