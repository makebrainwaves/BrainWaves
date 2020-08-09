/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React from 'react';
import { Segment, Form, Button, Table, Dropdown } from 'semantic-ui-react';
import styles from '../styles/common.css';

interface Props {
  name: string;
  num: number;
  response: string;
  dir: string;
  condition: string;
  phase: string;
  onChange: (num: number, arg1: string, arg2: string) => void;
  onDelete: (num: number) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString(),
}));

export const StimuliRow: React.FC<Props> = (props) => {
  return (
    <Table.Row className={styles.trialsRow}>
      <Table.Cell className={styles.conditionsNameRow}>
        <div style={{ alignSelf: 'center' }}>{props.num + 1}.</div>
        <div>{props.name}</div>
      </Table.Cell>

      <Table.Cell className={styles.experimentRowName}>
        <div>{props.condition}</div>
      </Table.Cell>

      <Table.Cell className={styles.experimentRowName}>
        <Form.Select
          fluid
          selection
          value={props.response}
          onChange={(event, data) =>
            props.onChange(props.num, 'response', data.value)
          }
          placeholder="Response"
          options={RESPONSE_OPTIONS}
        />
      </Table.Cell>

      <Table.Cell className={styles.trialsTrialTypeRow}>
        <Segment basic className={styles.trialsTrialTypeSegment}>
          <div
            className={styles.trialsTrialTypeRowSelector}
            style={{
              backgroundColor: props.phase === 'main' ? '#1AC4EF' : '#EB1B66',
            }}
          >
            {props.phase === 'main' ? 'Experimental' : 'Practice'}
          </div>
          <Dropdown
            fluid
            style={{
              display: 'grid',
              color: '#C4C4C4',
              justifyContent: 'end',
            }}
          >
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => props.onChange(props.num, 'phase', 'main')}
              >
                <div>Experimental</div>
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => props.onChange(props.num, 'phase', 'practice')}
              >
                <div>Practice</div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Segment>

        <Button
          secondary
          onClick={() => {
            props.onDelete(props.num);
          }}
        >
          Delete
        </Button>
      </Table.Cell>
    </Table.Row>
  );
};
