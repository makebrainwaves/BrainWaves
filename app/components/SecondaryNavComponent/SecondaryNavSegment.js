import React, { Component } from 'react';
import { Grid } from 'semantic-ui-react';
import styles from '../styles/secondarynav.css';

interface Props {
  title: string;
  style: string;
  onClick: () => void;
}

export default class SecondaryNavSegment extends Component<Props> {
  // props: Props;

  render() {
    return (
      <Grid.Column
        as='a'
        onClick={this.props.onClick}
        textAlign='center'
        verticalAlign='bottom'
        className={[this.props.style, styles.secondaryNavSegment].join(' ')}
      >
        {this.props.title}
      </Grid.Column>
    );
  }
}
