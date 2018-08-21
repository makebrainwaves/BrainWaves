import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { isNil } from "lodash";
import { Observable } from "rxjs/Observable";

import { Grid, List } from "semantic-ui-react";
import { EXPERIMENTS, DEVICES } from "../constants/constants";
import styles from "./styles/topnavbar.css";

interface Props {
  location: { pathname: string, search: string, hash: string };
  type: EXPERIMENTS;
  rawObservable: ?Observable;
  mainChannel: ?any;
  deviceType: DEVICES;
}

export default class TopNav extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.navContainer}>
        <Grid textAlign="center">
          <Grid.Row columns="equal">
            <Grid.Column width={5}>
              <List horizontal>
                <List.Item>
                  <List.Header>Experiment</List.Header> {this.props.type}
                </List.Item>
                <List.Item>
                  <List.Header>Device</List.Header>
                  {`${this.props.deviceType}  ${this.props.connectionStatus}`}
                </List.Item>
                <List.Item>
                  <List.Header>Jupyter</List.Header>
                  {isNil(this.props.mainChannel) ? "Offline" : "Online"}
                </List.Item>
              </List>
            </Grid.Column>
            <Grid.Column>
              <NavLink to="/home" activeClassName={styles.activeNavLink}>
                HOME
              </NavLink>
            </Grid.Column>
            <Grid.Column>
              <NavLink
                to="/experimentDesign"
                activeClassName={styles.activeNavLink}
              >
                DESIGN
              </NavLink>
            </Grid.Column>
            <Grid.Column>
              <NavLink
                to="/deviceConnect"
                activeClassName={styles.activeNavLink}
              >
                CONNECT
              </NavLink>
            </Grid.Column>
            <Grid.Column>
              <NavLink
                to="/experimentRun"
                activeClassName={styles.activeNavLink}
              >
                RUN
              </NavLink>
            </Grid.Column>
            <Grid.Column>
              <NavLink to="/analyze" activeClassName={styles.activeNavLink}>
                ANALYZE
              </NavLink>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}
