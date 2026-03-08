import React, { Component } from 'react';
import path from 'pathe';
import { Link } from 'react-router-dom';
import { isNil, isArray, isString } from 'lodash';
import styles from '../styles/collect.module.css';
import commonStyles from '../styles/common.module.css';
import { EXPERIMENTS, DEVICES } from '../../constants/constants';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import { PyodideActions, ExperimentActions } from '../../actions';

interface DropdownOption {
  key: string;
  text: string;
  value: string;
}

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
        : ['⭐', '☆', '✕', '📖'];
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
          return acc.concat({
            key: curr,
            text: curr,
            value: curr,
          });
        }, []),
      eegFilePaths: workspaceRawData.map((filepath) => ({
        key: filepath.name,
        text: filepath.name,
        value: filepath.path,
      })),
    });
  }

  handleRecordingChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (opt) => opt.value
    );
    this.setState({ selectedFilePaths: selectedOptions });
  }

  handleSubjectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (isString(value)) {
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
        <div className="text-left p-4">
          {this.props.epochsInfo.map((infoObj, index) => (
            <div key={infoObj.name as string} className="p-4">
              <span>{this.icons[index]}</span>
              {infoObj.name}
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
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium">
              Analyze Dataset
            </button>
          </Link>
        );
      }
    }
    return <></>;
  }

  render() {
    const filteredFilePaths = this.state.eegFilePaths.filter((filepath) => {
      const strVal = filepath.value;
      if (isString(strVal)) {
        const subjectFromFilepath = strVal.split(path.sep)[
          strVal.split(path.sep).length - 3
        ];
        return this.state.selectedSubject === subjectFromFilepath;
      }
      return false;
    });

    return (
      <div className={`relative flex overflow-hidden ${styles.preTestPushable}`}>
        {this.state.isSidebarVisible && (
          <div className="absolute right-0 top-0 h-full w-80 z-10 border rounded-lg p-4 bg-white shadow-sm overflow-y-auto">
            <CleanSidebar handleClose={this.handleSidebarToggle} />
          </div>
        )}
        <div className={`flex-1 ${this.state.isSidebarVisible ? 'mr-80' : ''}`}>
          <div
            className={`grid grid-cols-12 gap-4 text-center ${styles.preTestContainer}`}
          >
            <div className="col-span-12 flex items-center w-full gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-left">Clean</h1>
              </div>
            </div>
            <div className="col-span-6">
              <div
                className={`text-left p-4 ${commonStyles.infoSegment}`}
              >
                <h1 className="text-2xl font-bold">Select &amp; Clean</h1>
                <p>
                  Ready to clean some data? Select a subject and one or more
                  EEG recordings, then launch the editor
                </p>
                <h4 className="text-base font-semibold mt-4 mb-1">
                  Select Subject
                </h4>
                <select
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={this.state.selectedSubject}
                  onChange={this.handleSubjectChange}
                >
                  {this.state.subjects.map((subject) => (
                    <option key={subject.key} value={subject.value}>
                      {subject.text}
                    </option>
                  ))}
                </select>
                <h4 className="text-base font-semibold mt-4 mb-1">
                  Select Recordings
                </h4>
                <select
                  multiple
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={this.state.selectedFilePaths}
                  onChange={this.handleRecordingChange}
                >
                  {filteredFilePaths.map((filepath) => (
                    <option key={filepath.key} value={filepath.value}>
                      {filepath.text}
                    </option>
                  ))}
                </select>
                <hr className="my-4 border-gray-200" />
                <div className="flex flex-wrap gap-4 text-center">
                  <div className="flex-1">
                    <button
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
                      onClick={this.handleLoadData}
                    >
                      Load Dataset
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isNil(this.props.epochsInfo)}
                      onClick={() => this.props.PyodideActions.CleanEpochs()}
                    >
                      Clean Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-4">
              {this.renderEpochLabels()}
              {this.renderAnalyzeButton()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
