import React, { Component } from 'react';
import { Grid, Button, Segment } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { EXPERIMENTS, SCREENS } from '../../constants/constants';
import styles from '../styles/topnavbar.css';
import PrimaryNavSegment from './PrimaryNavSegment';
import { openWorkspaceDir } from '../../utils/filesystem/storage';

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
        columns="equal"
        textAlign="center"
        verticalAlign="middle"
      >
        <Grid.Column width="3" className={styles.experimentTitleSegment}>
          <Segment basic as="p">
            {this.props.title ? this.props.title : 'Untitled'}
            <Button
              icon="folder open outline"
              basic
              circular
              className={styles.closeButton}
              onClick={() => openWorkspaceDir(this.props.title)}
            />
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
        {this.props.isEEGEnabled ?
          <PrimaryNavSegment
            {...SCREENS.CLEAN}
            style={this.getStyleForScreen(SCREENS.CLEAN)}
          /> : null
        }
        {this.props.isEEGEnabled ?
          <PrimaryNavSegment
            {...SCREENS.ANALYZE}
            style={this.getStyleForScreen(SCREENS.ANALYZE)}
          />
          :
          <PrimaryNavSegment
            {...SCREENS.ANALYZEBEHAVIOR}
            style={this.getStyleForScreen(SCREENS.ANALYZE)}
          />
        }
        <Grid.Column width="3">
          <NavLink to={SCREENS.HOME.route}>
            <Button secondary size="medium">
              Exit Workspace
            </Button>
          </NavLink>
        </Grid.Column>
      </Grid>
    );
  }
}
