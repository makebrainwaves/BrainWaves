import { Segment } from 'semantic-ui-react';
import React, { PureComponent } from 'react';
import Slider from 'rc-slider';
import styles from '../styles/common.css';

interface Props {
  value: number;
  label: string;
  onChange: number => void;
}

const marks = {
  1: '0.25',
  2: '0.5',
  3: '0.75',
  4: '1',
  5: '1.25',
  6: '1.5',
  7: '1.75',
  8: '2'
};

// Converts from a 1-8 scale to a range from 250 to 2000 ms
const MS_CONVERSION = 250;

export default class ParamSlider extends PureComponent<Props> {
  render() {
    return (
      <div>
        <p className={styles.label}>{this.props.label}</p>
        <Segment basic>
          <Slider
            dots
            marks={marks}
            min={1}
            max={4}
            value={this.props.value / MS_CONVERSION}
            onChange={value => this.props.onChange(value * MS_CONVERSION)}
            defaultValue={1}
          />
        </Segment>
      </div>
    );
  }
}
