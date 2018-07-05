/* eslint flowtype-errors/show-errors: 0 */
import React from "react";
import { Switch, Route } from "react-router";
import App from "./containers/App";
import HomePage from "./containers/HomePage";
import ExperimentRunPage from "./containers/ExperimentRunPage";

export default () => (
  <App>
    <Switch>
      <Route path="/experimentRun" component={ExperimentRunPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </App>
);
