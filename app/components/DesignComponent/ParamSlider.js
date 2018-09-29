import { Segment } from "semantic-ui-react";
import React, { PureComponent } from "react";
import Slider from "rc-slider";
import styles from "../styles/common.css";

interface Props {
  value: number;
  label: string;
  onChange: number => void;
}

const marks = {
  1: "0.5",
  2: "1",
  3: "1.5",
  4: "2"
};

// Converts from a 1-4 scale to a range from 500 to 2000 ms
const MS_CONVERSION = 500;

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
