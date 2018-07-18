/* eslint flowtype-errors/show-errors: 0 */
import React from "react";
import { Switch, Route } from "react-router";
import App from "./containers/App";
import HomeContainer from "./containers/HomeContainer";
import ExperimentRunContainer from "./containers/ExperimentRunContainer";
import ExperimentDesignContainer from "./containers/ExperimentDesignContainer";
import DeviceConnectContainer from "./containers/DeviceConnectContainer";
import AnalyzeContainer from "./containers/AnalyzeContainer";

// NOTE: Home component "/" must be the last child in Switch
export default () => (
  <App>
    <Switch>
      <Route path="/analyze" componen={AnalyzeContainer} />
      <Route path="/deviceConnect" component={DeviceConnectContainer} />
      <Route path="/experimentRun" component={ExperimentRunContainer} />
      <Route path="/experimentDesign" component={ExperimentDesignContainer} />
      <Route path="/" component={HomeContainer} />
    </Switch>
  </App>
);
