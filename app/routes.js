/* eslint flowtype-errors/show-errors: 0 */
import React from "react";
import { Switch, Route } from "react-router";
import App from "./containers/App";
import HomeContainer from "./containers/HomeContainer";
import ExperimentDesignContainer from "./containers/ExperimentDesignContainer";
import CollectContainer from "./containers/CollectContainer";
import CleanContainer from "./containers/CleanContainer";
import AnalyzeContainer from "./containers/AnalyzeContainer";
import { SCREENS } from "./constants/constants";

export default () => (
  <App>
    <Switch>
      <Route path={SCREENS.ANALYZE.route} component={AnalyzeContainer} />
      <Route path={SCREENS.CLEAN.route} component={CleanContainer} />
      <Route path={SCREENS.COLLECT.route} component={CollectContainer} />
      <Route
        path={SCREENS.DESIGN.route}
        component={ExperimentDesignContainer}
      />
      <Route path="/home" component={HomeContainer} />
      <Route path="/" default component={HomeContainer} />
    </Switch>
  </App>
);
