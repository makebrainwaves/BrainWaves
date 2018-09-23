import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';
import styles from '../styles/secondarynav.css';

interface Props {
  title: string;
  style: string;
  onClick: () => void;
}

export default class SecondaryNavSegment extends Component<Props> {
  props: Props;

  render() {
    return (
      <Grid.Column
        width={3}
        textAlign="center"
        className={[this.props.style, styles.secondaryNavSegment].join(' ')}
      >
        <a role="link" tabIndex={0} onClick={this.props.onClick}>
          {this.props.title}
        </a>
      </Grid.Column>
    );
  }
}
