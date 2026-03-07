import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isNil } from 'lodash';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import styles from '../styles/topnavbar.module.css';
import PrimaryNavSegment from './PrimaryNavSegment';
import {
  readAndParseState,
  readWorkspaces,
} from '../../utils/filesystem/storage';
import BrainwavesIcon from '../../assets/common/Brainwaves_Icon_big.png';
import { ExperimentActions } from '../../actions';

export interface Props {
  title: string | null | undefined;
  isRunning: boolean;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
  type: EXPERIMENTS;
}

export default function TopNavComponent(props: Props) {
  const location = useLocation();
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);

  const getStyleForScreen = (
    navSegmentScreen: (typeof SCREENS)[keyof typeof SCREENS]
  ) => {
    if (navSegmentScreen.route === location.pathname) {
      return styles.activeNavColumn;
    }
    const routeOrder = Object.values(SCREENS).find(
      (screen) => screen.route === navSegmentScreen.route
    )?.order;
    const currentOrder = Object.values(SCREENS).find(
      (screen) => screen.route === location.pathname
    )?.order;
    if (routeOrder && currentOrder && currentOrder > routeOrder) {
      return styles.visitedNavColumn;
    }
    return styles.initialNavColumn;
  };

  const updateWorkspaces = async () => {
    setRecentWorkspaces(await readWorkspaces());
  };

  const handleLoadRecentWorkspace = async (dir: string) => {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState != null) {
      props.ExperimentActions.SetState(recentWorkspaceState);
    }
  };

  if (
    location.pathname === SCREENS.HOME.route ||
    location.pathname === SCREENS.BANK.route ||
    location.pathname === '/' ||
    props.isRunning
  ) {
    return null;
  }

  return (
    <div className={styles.navContainer}>
      <div className={styles.experimentTitleGridColumn}>
        <div className={styles.homeButton}>
          <NavLink to={SCREENS.HOME.route}>
            <img
              className={styles.exitWorkspaceBtn}
              src={BrainwavesIcon}
              alt="Home"
            />
            Home
          </NavLink>
        </div>
      </div>

      <div className={styles.experimentTitleGridColumn}>
        <div className="relative">
          <button
            onClick={updateWorkspaces}
            className={styles.workspaceDropdownTrigger}
          >
            {props.title ? props.title : 'Untitled'}
          </button>
          {recentWorkspaces.length > 0 && (
            <ul className={styles.workspaceDropdownMenu}>
              {recentWorkspaces.map((workspace) => (
                <li key={workspace}>
                  <button
                    onClick={() => handleLoadRecentWorkspace(workspace)}
                    className={styles.workspaceDropdownItem}
                  >
                    {workspace}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PrimaryNavSegment
        {...SCREENS.DESIGN}
        style={getStyleForScreen(SCREENS.DESIGN)}
      />
      <PrimaryNavSegment
        {...SCREENS.COLLECT}
        style={getStyleForScreen(SCREENS.COLLECT)}
      />
      {props.isEEGEnabled ? (
        <PrimaryNavSegment
          {...SCREENS.CLEAN}
          style={getStyleForScreen(SCREENS.CLEAN)}
        />
      ) : null}
      {props.isEEGEnabled ? (
        <PrimaryNavSegment
          {...SCREENS.ANALYZE}
          style={getStyleForScreen(SCREENS.ANALYZE)}
        />
      ) : (
        <PrimaryNavSegment
          {...SCREENS.ANALYZEBEHAVIOR}
          style={getStyleForScreen(SCREENS.ANALYZE)}
        />
      )}
    </div>
  );
}
