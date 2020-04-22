import React, { Component } from 'react';
import { Grid, Button, Segment, Image, Dropdown } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import styles from '../styles/topnavbar.css';
import PrimaryNavSegment from './PrimaryNavSegment';
import { openWorkspaceDir } from '../../utils/filesystem/storage';
import BrainwavesIcon from '../../assets/common/Brainwaves_Icon_big.png';

interface Props {
  title: ?string;
  location: { pathname: string, search: string, hash: string };
  isRunning: boolean;
  experimentActions: Object;
  type: EXPERIMENTS;
}

export default class TopNavComponent extends Component<Props> {
  props: Props;

  getStyleForScreen(navSegmentScreen: SCREENS) {
    if (navSegmentScreen.route === this.props.location.pathname) {
      return styles.activeNavColumn;
    }
    const routeOrder = Object.values(SCREENS).find(
      screen => screen.route === navSegmentScreen.route
    ).order;
    const currentOrder = Object.values(SCREENS).find(
      screen => screen.route === this.props.location.pathname
    ).order;
    if (currentOrder > routeOrder) {
      return styles.visitedNavColumn;
    }
    return styles.initialNavColumn;
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
      <Grid
        className={styles.navContainer}
        verticalAlign="middle"
        columns="16"
      >
        <Grid.Column width={1} className={styles.experimentTitleGridColumn}>
          <Segment basic>
            <NavLink to={SCREENS.HOME.route} >
              <Image
                centered
                className={styles.exitWorkspaceBtn}
                src={BrainwavesIcon}
              />
            </NavLink>
          </Segment>
        </Grid.Column>

        <Grid.Column width={1} className={styles.experimentTitleGridColumn}>
          <Segment basic>
            <NavLink to={SCREENS.HOME.route} >
              Home
            </NavLink>
          </Segment>
        </Grid.Column>

        <Grid.Column width={2} className={styles.experimentTitleGridColumn}>
          <Segment basic>
            <Dropdown
              text={this.props.title ? this.props.title : 'Untitled'}
              direction="right"
              simple
            >
              <Dropdown.Menu>
                <Dropdown.Item>
                  <NavLink to={SCREENS.BANK.route}>
                    <p>
                      Experiment Bank
                    </p>
                  </NavLink>
                </Dropdown.Item>
                <Dropdown.Item>
                  <NavLink to={SCREENS.HOME.route}>
                    <p>
                      My Experiments
                    </p>
                  </NavLink>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Segment>
        </Grid.Column>

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

      </Grid>
    );
  }
}
