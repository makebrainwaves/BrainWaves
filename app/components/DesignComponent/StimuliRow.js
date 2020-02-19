/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { Component } from 'react';
import { Grid, Segment, Header, Form, Label, Icon, Button, Table } from 'semantic-ui-react';
import { toast } from 'react-toastify';
import styles from '../styles/common.css';

interface Props {
  num: number;
  response: string;
  dir: string;
  condition: string;
  onChange: (string, string) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString()
}));

export default class StimuliRow extends Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <Table.Row className={styles.trialsRow}>
        <Table.Cell className={styles.conditionsNameRow}>
          <div style={{'alignSelf':'center'}}>
            {this.props.num + 1}.
          </div>
          <div>
            {this.props.name}
          </div>
        </Table.Cell>

        <Table.Cell className={styles.experimentRowName}>
          <div>
            {this.props.condition}
          </div>
        </Table.Cell>

        <Table.Cell className={styles.experimentRowName}>
          <Form.Select
            fluid
            selection
            value={this.props.response}
            onChange={(event, data) =>
            this.props.onChange(this.props.num, 'response', data.value)
          }
            placeholder="Response"
            options={RESPONSE_OPTIONS}
          />
        </Table.Cell>

        <Table.Cell className={styles.trialsTrialTypeRow}>
          <Form.Select
            fluid
            selection
            value={this.props.phase}
            onChange={(event, data) =>
            this.props.onChange(this.props.num, 'phase', data.value)
          }
            placeholder="Response"
            options={[{key: 'main', text: 'Experimental', value: 'main'},
            {key: 'practice', text: 'Practice', value: 'practice'}]}
          />
          <Button
            secondary
            onClick={() => {
              this.props.onDelete(this.props.num)
            }}
          >
            Delete
          </Button>
        </Table.Cell>

      </Table.Row>

    );
  }
}
