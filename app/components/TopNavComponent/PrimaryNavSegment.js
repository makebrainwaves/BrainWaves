import React, { Component } from "react";
import { Grid } from "semantic-ui-react";
import { NavLink } from "react-router-dom";
import styles from "../styles/topnavbar.css";

export default class PrimaryNavSegment extends Component {
  render() {
    return (
      <Grid.Column className={[this.props.style, styles.navColumn].join(" ")}>
        <NavLink to={this.props.route}>
          <div className={styles.numberBubble}>{this.props.order}</div>
          {this.props.title}
        </NavLink>
      </Grid.Column>
    );
  }
}
