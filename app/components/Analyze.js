// @flow
import React, { Component } from "react";
import {
  Grid,
  Button,
  Icon,
  Step,
  Segment,
  Header,
  Dropdown
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import { isNil } from "lodash";
import styles from "./ExperimentDesign.css";
import { EXPERIMENTS } from "../constants/constants";
import { MainTimeline, Trial, Timeline } from "../constants/interfaces";
import { readEEGDataDir } from "../utils/filesystem/write";

interface Props {
  type: ?EXPERIMENTS;
  kernel: ?Kernel;
  mainChannel: ?any;
  epochsInfo: ?{ [string]: number };
  psdPlot: ?{ [string]: string };
  erpPlot: ?{ [string]: string };
  jupyterActions: Object;
}

interface State {
  isBusy: boolean;
  eegFilePaths: [?{ key: string, text: string, value: string }];
  selectedFilePaths: [?string];
}

export default class ExperimentDesign extends Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      isBusy: false,
      eegFilePaths: [],
      selectedFilePaths: []
    };
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({
      eegFilePaths: readEEGDataDir(this.props.type).map(filepath => ({
        key: filepath,
        text: filepath,
        value: filepath
      }))
    });
  }

  handleDropdownChange(e: Object, props: Object) {
    console.log(props);
    this.setState({ selectedFilePaths: props.value });
  }

  handleLoadData() {
    this.props.jupyterActions.loadEpochs(this.state.selectedFilePaths);
  }

  render() {
    return (
      <div>
        <Grid columns={3} relaxed>
          <Grid.Column>
            <Segment raised padded color="red">
              Epoch Info
              <span>
                <Dropdown
                  placeholder="Add Data"
                  inline
                  fluid
                  multiple
                  selection
                  options={this.state.eegFilePaths}
                  onChange={this.handleDropdownChange}
                />
                <Button onClick={this.handleLoadData}>Load Data</Button>
              </span>
            </Segment>
            <Segment raised padded color="red">
              Average ERP
            </Segment>
            <Segment raised padded color="red">
              PSD
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
