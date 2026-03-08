import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { App } from './containers/App';
import HomeContainer from './containers/HomeContainer';
import ExperimentDesignContainer from './containers/ExperimentDesignContainer';
import CollectContainer from './containers/CollectContainer';
import CleanContainer from './containers/CleanContainer';
import AnalyzeContainer from './containers/AnalyzeContainer';
import { SCREENS } from './constants/constants';

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
