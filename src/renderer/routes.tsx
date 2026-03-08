import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { App } from './containers/App';
import HomeContainerRaw from './containers/HomeContainer';
import ExperimentDesignContainerRaw from './containers/ExperimentDesignContainer';
import CollectContainerRaw from './containers/CollectContainer';
import CleanContainerRaw from './containers/CleanContainer';
import AnalyzeContainerRaw from './containers/AnalyzeContainer';
import { SCREENS } from './constants/constants';

// These connected components receive their required props from Redux.
// Cast to a permissive type so routes.tsx doesn't have to enumerate all mapped props.
const HomeContainer = HomeContainerRaw as React.ComponentType<{
  activeStep: string;
}>;
const ExperimentDesignContainer =
  ExperimentDesignContainerRaw as unknown as React.ComponentType;
const CollectContainer =
  CollectContainerRaw as unknown as React.ComponentType;
const CleanContainer = CleanContainerRaw as unknown as React.ComponentType;
const AnalyzeContainer =
  AnalyzeContainerRaw as unknown as React.ComponentType;

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
