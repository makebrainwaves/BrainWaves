import React, { Component } from 'react';
import { Grid, Button, Segment, Image } from 'semantic-ui-react';
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
      this.props.location.pathname === '/' ||
      this.props.isRunning
    ) {
      return null;
    }
    return (
      <Grid
        className={styles.navContainer}
        verticalAlign="middle"
        columns="equal"
      >
        <Grid.Column className={styles.experimentTitleGridColumn}>
          <Segment basic className={styles.experimentTitleSegment}>
            <NavLink to={SCREENS.HOME.route} >
              <div className={styles.homeTopNavButton}>
                <Image
                  centered
                  className={styles.exitWorkspaceBtn}
                  src={BrainwavesIcon}
                />
                Home
              </div>
            </NavLink>
            {this.props.title ? this.props.title : 'Untitled'}
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
