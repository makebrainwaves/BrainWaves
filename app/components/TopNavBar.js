import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { Grid, Button, Icon, Header, List } from "semantic-ui-react";
import { EXPERIMENTS, DEVICES } from "../constants/constants";
import { isNil } from "lodash";
import styles from "./TopNavBar.css";

interface Props {
  location: { pathname: string, search: string, hash: string };
  type: EXPERIMENTS;
  rawObservable: ?any;
  mainChannel: ?any;
  deviceType: DEVICES;
}

export default class TopNavBar extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.navContainer}>
        <Grid columns={7} textAlign="center">
          <Grid.Column width={4}>
            <List horizontal>
              <List.Item>
                <List.Header>Experiment</List.Header> {this.props.type}
              </List.Item>
              <List.Item>
                <List.Header>Device</List.Header>
                {`${this.props.deviceType}  ${
                  isNil(this.props.rawObservable) ? "Disconnected" : "Connected"
                }`}
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
            <NavLink to="/deviceConnect" activeClassName={styles.activeNavLink}>
              CONNECT
            </NavLink>
          </Grid.Column>
          <Grid.Column>
            <NavLink to="/experimentRun" activeClassName={styles.activeNavLink}>
              RUN
            </NavLink>
          </Grid.Column>
          <Grid.Column>
            <NavLink to="/analyze" activeClassName={styles.activeNavLink}>
              ANALYZE
            </NavLink>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
