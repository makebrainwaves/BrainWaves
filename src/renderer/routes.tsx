import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { App } from './containers/App';
import HomeContainerRaw from './containers/HomeContainer';
import ExperimentDesignContainerRaw from './containers/ExperimentDesignContainer';
import CollectContainerRaw from './containers/CollectContainer';
import CleanContainer from './containers/CleanContainer';
import AnalyzeContainer from './containers/AnalyzeContainer';
import { SCREENS } from './constants/constants';

// TypeScript cannot infer the type subtraction performed by withRouter<P> when
// the argument is a ConnectedComponent (react-redux) rather than a plain
// ComponentType. This is a known limitation at the class-component + connect +
// withRouter boundary; the HOC works correctly at runtime. The casts below are
// the pragmatic bridge until these screens are converted to functional components.
const HomeContainer = HomeContainerRaw as React.ComponentType<{
  activeStep: string;
}>;
const ExperimentDesignContainer =
  ExperimentDesignContainerRaw as unknown as React.ComponentType;
const CollectContainer =
  CollectContainerRaw as unknown as React.ComponentType;

export default function AppRoutes() {
  return (
    <App>
      <Routes>
        <Route path={SCREENS.ANALYZE.route} element={<AnalyzeContainer />} />
        <Route path={SCREENS.CLEAN.route} element={<CleanContainer />} />
        <Route path={SCREENS.COLLECT.route} element={<CollectContainer />} />
        <Route
          path={SCREENS.DESIGN.route}
          element={<ExperimentDesignContainer />}
        />
        <Route
          path="/home"
          element={<HomeContainer activeStep="EXPERIMENT BANK" />}
        />
        <Route
          path="/"
          element={<HomeContainer activeStep="MY EXPERIMENTS" />}
        />
      </Routes>
    </App>
  );
}
