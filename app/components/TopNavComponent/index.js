import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { Observable } from "rxjs/Observable";
import { Segment, Header, Grid, Button, Icon } from "semantic-ui-react";
import { EXPERIMENTS, SCREENS, DEVICES } from "../../constants/constants";
import styles from "../styles/topnavbar.css";
import PrimaryNavSegment from "./PrimaryNavSegment";

interface Props {
  location: { pathname: string, search: string, hash: string };
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
    return (
      <Grid
        className={styles.navContainer}
        columns="equal"
        textAlign="center"
        verticalAlign="middle"
      >
        <Grid.Column width="3" className={styles.experimentTitleSegment}>
          {this.props.type}
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
          <Button secondary size="medium">
            Save Workspace
          </Button>
        </Grid.Column>
      </Grid>
    );
  }
}
