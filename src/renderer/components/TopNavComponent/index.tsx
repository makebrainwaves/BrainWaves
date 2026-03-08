import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
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
  location: { pathname: string; search: string; hash: string };
  isRunning: boolean;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
  type: EXPERIMENTS;
}

interface State {
  recentWorkspaces: Array<string>;
  isDropdownOpen: boolean;
}

export default class TopNavComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      recentWorkspaces: [],
      isDropdownOpen: false,
    };
    this.getStyleForScreen = this.getStyleForScreen.bind(this);
    this.updateWorkspaces = this.updateWorkspaces.bind(this);
    this.handleLoadRecentWorkspace = this.handleLoadRecentWorkspace.bind(this);
  }

  getStyleForScreen(navSegmentScreen: (typeof SCREENS)[keyof typeof SCREENS]) {
    if (navSegmentScreen.route === this.props.location.pathname) {
      return styles.activeNavColumn;
    }

    const routeOrder = Object.values(SCREENS).find(
      (screen) => screen.route === navSegmentScreen.route
    )?.order;
    const currentOrder = Object.values(SCREENS).find(
      (screen) => screen.route === this.props.location.pathname
    )?.order;
    if (routeOrder && currentOrder && currentOrder > routeOrder) {
      return styles.visitedNavColumn;
    }
    return styles.initialNavColumn;
  }

  updateWorkspaces = async () => {
    this.setState({ recentWorkspaces: await readWorkspaces() });
  };

  async handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState != null) {
      this.props.ExperimentActions.SetState(recentWorkspaceState);
    }
  }

  render() {
    if (
      this.props.location.pathname === SCREENS.HOME.route ||
      this.props.location.pathname === SCREENS.BANK.route ||
      this.props.location.pathname === '/' ||
      this.props.isRunning
    ) {
      return null;
    }
    return (
      <div className={`flex items-center gap-4 flex-wrap ${styles.navContainer}`}>
        <div className={styles.experimentTitleGridColumn}>
          <div className={`p-4 ${styles.homeButton}`}>
            <NavLink to={SCREENS.HOME.route}>
              <img
                className={`mx-auto ${styles.exitWorkspaceBtn}`}
                src={BrainwavesIcon}
              />
              Home
            </NavLink>
          </div>
        </div>

        <div className={styles.experimentTitleGridColumn}>
          <div className="p-4 relative">
            <button
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-200"
              onClick={() => {
                this.updateWorkspaces();
                this.setState((s) => ({ isDropdownOpen: !s.isDropdownOpen }));
              }}
            >
              {this.props.title ? this.props.title : 'Untitled'}
            </button>
            {this.state.isDropdownOpen && (
              <ul className="absolute top-full left-0 bg-white border rounded shadow-lg z-10 min-w-max">
                {this.state.recentWorkspaces.map((workspace) => (
                  <li
                    key={workspace}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      this.handleLoadRecentWorkspace(workspace);
                      this.setState({ isDropdownOpen: false });
                    }}
                  >
                    <p>{workspace}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <PrimaryNavSegment
          {...SCREENS.DESIGN}
          style={this.getStyleForScreen(SCREENS.DESIGN)}
        />
        <PrimaryNavSegment
          {...SCREENS.COLLECT}
          style={this.getStyleForScreen(SCREENS.COLLECT)}
        />
        {this.props.isEEGEnabled ? (
          <PrimaryNavSegment
            {...SCREENS.CLEAN}
            style={this.getStyleForScreen(SCREENS.CLEAN)}
          />
        ) : null}
        {this.props.isEEGEnabled ? (
          <PrimaryNavSegment
            {...SCREENS.ANALYZE}
            style={this.getStyleForScreen(SCREENS.ANALYZE)}
          />
        ) : (
          <PrimaryNavSegment
            {...SCREENS.ANALYZEBEHAVIOR}
            style={this.getStyleForScreen(SCREENS.ANALYZE)}
          />
        )}
      </div>
    );
  }
}
