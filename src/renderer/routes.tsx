import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { App } from './containers/App';
import HomeContainer from './containers/HomeContainer';
import BankContainer from './containers/BankContainer';
import ExploreContainer from './containers/ExploreContainer';
import ExperimentDesignContainer from './containers/ExperimentDesignContainer';
import CollectContainer from './containers/CollectContainer';
import CleanContainer from './containers/CleanContainer';
import AnalyzeContainer from './containers/AnalyzeContainer';
import WorkspaceAreaGate from './components/AppShell/WorkspaceAreaGate';
import { SCREENS } from './constants/constants';

export default function AppRoutes() {
  return (
    <App>
      <Routes>
        <Route
          path={SCREENS.ANALYZE.route}
          element={
            <WorkspaceAreaGate area="analyze">
              <AnalyzeContainer />
            </WorkspaceAreaGate>
          }
        />
        <Route
          path={SCREENS.CLEAN.route}
          element={
            <WorkspaceAreaGate area="clean">
              <CleanContainer />
            </WorkspaceAreaGate>
          }
        />
        <Route path={SCREENS.COLLECT.route} element={<CollectContainer />} />
        <Route
          path={SCREENS.DESIGN.route}
          element={<ExperimentDesignContainer />}
        />
        <Route path="/explore" element={<ExploreContainer />} />
        <Route path="/home" element={<BankContainer />} />
        <Route path="/" element={<HomeContainer />} />
      </Routes>
    </App>
  );
}
