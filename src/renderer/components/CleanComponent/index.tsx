import React, { Component } from 'react';
import path from 'pathe';
import { Link } from 'react-router-dom';
import { isNil, isString } from 'lodash';
import { Button } from '../ui/button';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import { PyodideActions, ExperimentActions } from '../../actions';

export interface Props {
  type?: EXPERIMENTS;
  title: string;
  deviceType: DEVICES;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  PyodideActions: typeof PyodideActions;
  ExperimentActions: typeof ExperimentActions;
  subject: string;
  session: number;
}

interface DropdownOption {
  key: string;
  text: string;
  value: string;
}

interface State {
  subjects: Array<DropdownOption>;
  eegFilePaths: Array<DropdownOption>;
  selectedSubject: string;
  selectedFilePaths: Array<string>;
  isSidebarVisible: boolean;
}

export default class Clean extends Component<Props, State> {
  icons: string[];

  constructor(props: Props) {
    super(props);
    this.state = {
      subjects: [],
      eegFilePaths: [{ key: '', text: '', value: '' }],
      selectedFilePaths: [],
      selectedSubject: props.subject,
      isSidebarVisible: false,
    };
    this.handleRecordingChange = this.handleRecordingChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.icons =
      props.type === EXPERIMENTS.N170
        ? ['😊', '🏠', '✕', '📖']
        : ['★', '☆', '✕', '📖'];
  }

  async componentDidMount() {
    const workspaceRawData = await readWorkspaceRawEEGData(this.props.title);
    this.setState({
      subjects: workspaceRawData
        .map(
          (filepath) =>
            filepath.path.split(path.sep)[
              filepath.path.split(path.sep).length - 3
            ]
        )
        .reduce((acc, curr) => {
          if (acc.find((subject) => subject.key === curr)) {
            return acc;
          }
          return acc.concat({ key: curr, text: curr, value: curr });
        }, []),
      eegFilePaths: workspaceRawData.map((filepath) => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path,
      })),
    });
  }

  handleRecordingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const filePaths = Array.from(e.target.selectedOptions, (o) => o.value);
    this.setState({ selectedFilePaths: filePaths });
  }

  handleSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!isNil(value) && isString(value)) {
      this.setState({ selectedSubject: value, selectedFilePaths: [] });
    }
  }

  handleLoadData() {
    this.props.ExperimentActions.SetSubject(this.state.selectedSubject);
    this.props.PyodideActions.LoadEpochs(this.state.selectedFilePaths);
  }

  handleSidebarToggle() {
    this.setState({ isSidebarVisible: !this.state.isSidebarVisible });
  }

  renderEpochLabels() {
    if (
      !isNil(this.props.epochsInfo) &&
      this.state.selectedFilePaths.length >= 1
    ) {
      return (
        <div className="text-left">
          {this.props.epochsInfo.map((infoObj, index) => (
            <div key={String(infoObj.name)} className="mb-2">
              <span>{this.icons[index]}</span>
              {' '}{infoObj.name}
              <p>{infoObj.value}</p>
            </div>
          ))}
        </div>
      );
    }
    return <div />;
  }

  renderAnalyzeButton() {
    const { epochsInfo } = this.props;
    if (!isNil(epochsInfo)) {
      const drop = epochsInfo.find(
        (infoObj) => infoObj.name === 'Drop Percentage'
      )?.value;

      if (drop && typeof drop === 'number' && drop >= 2) {
        return (
          <Link to="/analyze">
            <Button variant="default">Analyze Dataset</Button>
          </Link>
        );
      }
    }
    return null;
  }

  render() {
    const filteredFilePaths = this.state.eegFilePaths.filter((filepath) => {
      const strVal = filepath.value;
      const subjectFromFilepath = strVal.split(path.sep)[strVal.split(path.sep).length - 3];
      return this.state.selectedSubject === subjectFromFilepath;
    });

    return (
      <div className="relative flex h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
        {this.state.isSidebarVisible && (
          <div className="absolute right-0 top-0 h-full w-64 z-10">
            <CleanSidebar handleClose={this.handleSidebarToggle} />
          </div>
        )}
        <div className="flex-1 p-[3%]">
          <div className="flex items-center mb-4">
            <h1>Clean</h1>
          </div>
          <div className="flex gap-4">
            <div className="w-6/12 text-left">
              <h1>Select & Clean</h1>
              <p>
                Ready to clean some data? Select a subject and one or more
                EEG recordings, then launch the editor
              </p>
              <h4>Select Subject</h4>
              <select
                className="w-full border border-gray-300 rounded p-1 mb-2"
                value={this.state.selectedSubject}
                onChange={this.handleSubjectChange}
              >
                {this.state.subjects.map((s) => (
                  <option key={s.key} value={s.value}>{s.text}</option>
                ))}
              </select>
              <h4>Select Recordings</h4>
              <select
                multiple
                className="w-full border border-gray-300 rounded p-1"
                value={this.state.selectedFilePaths}
                onChange={this.handleRecordingChange}
              >
                {filteredFilePaths.map((fp) => (
                  <option key={fp.key} value={fp.value}>{fp.text}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="w-full" onClick={this.handleLoadData}>
                  Load Dataset
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  disabled={isNil(this.props.epochsInfo)}
                  onClick={() => this.props.PyodideActions.CleanEpochs()}
                >
                  Clean Data
                </Button>
              </div>
            </div>
            <div className="w-4/12">
              {this.renderEpochLabels()}
              {this.renderAnalyzeButton()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
