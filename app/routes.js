/* eslint flowtype-errors/show-errors: 0 */
import React from "react";
import { Switch, Route } from "react-router";
import App from "./containers/App";
import HomeContainer from "./containers/HomeContainer";
import ExperimentRunContainer from "./containers/ExperimentRunContainer";
import ExperimentDesignContainer from "./containers/ExperimentDesignContainer";
import DeviceConnectContainer from "./containers/DeviceConnectContainer";
import AnalyzeContainer from "./containers/AnalyzeContainer";
import CleanContainer from "./containers/CleanContainer";

export default () => (
  <App>
    <Switch>
      <Route path="/analyze" component={AnalyzeContainer} />
      <Route path="/clean" component={CleanContainer} />
      <Route path="/deviceConnect" component={DeviceConnectContainer} />
      <Route path="/experimentRun" component={ExperimentRunContainer} />
      <Route path="/experimentDesign" component={ExperimentDesignContainer} />
      <Route path="/home" component={HomeContainer} />
      <Route path="/" default component={HomeContainer} />
    </Switch>
  </App>
);
