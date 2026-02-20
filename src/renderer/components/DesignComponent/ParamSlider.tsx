import { Segment } from 'semantic-ui-react';
import React from 'react';
import Slider from 'rc-slider';
import styles from '../styles/common.module.css';

interface Props {
  value: number;
  label: string;
  marks: { [num: number]: string };
  msConversion: string;
  onChange: (arg0: number) => void;
}

export const ParamSlider: React.FC<Props> = ({
  marks,
  msConversion,
  value,
  label,
  onChange,
}) => {
  return (
    <div>
      <p className={styles.label}>{label}</p>
      <Segment basic>
        {label !== 'Practice trials' || Object.keys(marks).length > 1 ? (
          <Slider
            dots
            marks={marks}
            min={Math.min(...Object.keys(marks).map(parseInt))}
            max={Math.max(...Object.keys(marks).map(parseInt))}
            value={value / parseInt(msConversion, 10)}
            onChange={(val) => onChange(val * parseInt(msConversion, 10))}
            defaultValue={1}
          />
        ) : (
          <div>You have not chosen any practice trials.</div>
        )}
      </Segment>
    </div>
  );
};
