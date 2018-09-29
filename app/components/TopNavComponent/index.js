import React, { Component } from "react";
import { Grid, Button } from "semantic-ui-react";
import { NavLink } from "react-router-dom";
import { EXPERIMENTS, SCREENS } from "../../constants/constants";
import styles from "../styles/topnavbar.css";
import PrimaryNavSegment from "./PrimaryNavSegment";

interface Props {
  title: ?string;
  location: { pathname: string, search: string, hash: string };
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
      this.props.location.pathname === "/"
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
          <NavLink to={SCREENS.HOME.route}>{this.props.title}</NavLink>
        </Grid.Column>
        <PrimaryNavSegment
          {...SCREENS.DESIGN}
          style={this.getStyleForScreen(SCREENS.DESIGN)}
        />
        <PrimaryNavSegment
          {...SCREENS.COLLECT}
          style={this.getStyleForScreen(SCREENS.COLLECT)}
        />
        <PrimaryNavSegment
          {...SCREENS.CLEAN}
          style={this.getStyleForScreen(SCREENS.CLEAN)}
        />
        <PrimaryNavSegment
          {...SCREENS.ANALYZE}
          style={this.getStyleForScreen(SCREENS.ANALYZE)}
        />
        <Grid.Column width="6">
          <Button
            secondary
            size="medium"
            onClick={this.props.experimentActions.saveWorkspace}
          >
            Save Workspace
          </Button>
        </Grid.Column>
      </Grid>
    );
  }
}
