import { Segment } from 'semantic-ui-react';
import React, { PureComponent } from 'react';
import Slider from 'rc-slider';
import styles from '../styles/common.css';

interface Props {
  value: number;
  label: string;
  onChange: (arg0: number) => void;
}

export default class ParamSlider extends PureComponent<Props> {
  render() {
    const { marks, ms_conversion } = this.props;
    return (
      <div>
        <p className={styles.label}>{this.props.label}</p>
        <Segment basic>
          {this.props.label !== 'Practice trials' ||
          Object.keys(marks).length > 1 ? (
            <Slider
              dots
              marks={this.props.marks}
              min={Math.min(...Object.keys(marks))}
              max={Math.max(...Object.keys(marks))}
              value={this.props.value / parseInt(ms_conversion, 10)}
              onChange={value =>
                this.props.onChange(value * parseInt(ms_conversion, 10))
              }
              defaultValue={1}
            />
          ) : (
            <div>You have not chosen any practice trials.</div>
          )}
        </Segment>
      </div>
    );
  }
}
