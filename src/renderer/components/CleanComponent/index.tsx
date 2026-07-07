import React, { Component } from 'react';
import path from 'pathe';
import { Link } from 'react-router-dom';
import { isNil, isString } from 'lodash';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  EXPERIMENTS,
  DEVICES,
  AUTO_FLAG_EXPERIMENTS,
  DEFAULT_PTP_THRESHOLD_UV,
} from '../../constants/constants';
import { ExperimentParameters } from '../../constants/interfaces';
import { buildMarkerRegistry } from '../../utils/eeg/markerRegistry';
import { readWorkspaceRawEEGData } from '../../utils/filesystem/storage';
import CleanSidebar from './CleanSidebar';
import EpochReviewer from './EpochReviewer';
import LiveErpPane from './LiveErpPane';
import {
  PyodideActions,
  ExperimentActions,
  EpochArraysMeta,
  SuggestedRejection,
} from '../../actions';

export interface Props {
  type?: EXPERIMENTS;
  title: string;
  deviceType: DEVICES;
  epochsInfo: Array<{
    [key: string]: number | string;
  }>;
  epochArrays: { buffer: ArrayBuffer; meta: EpochArraysMeta } | null;
  PyodideActions: typeof PyodideActions;
  ExperimentActions: typeof ExperimentActions;
  subject: string;
  session: number;
  params: ExperimentParameters | null;
  suggestedRejections: SuggestedRejection[];
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
  // ABSOLUTE epoch indices the student has marked for rejection.
  rejectedEpochs: Set<number>;
  // Channel names the student has flagged as bad (dropped across all epochs).
  badChannels: Set<string>;
  // Peak-to-peak threshold (µV) used by the auto-flag request.
  autoFlagThreshold: number;
  // Whether the auto-flag threshold settings panel is open.
  showAutoFlagSettings: boolean;
  // Whether the "too many bad channels" warning dialog is open.
  showChannelWarning: boolean;
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
      rejectedEpochs: new Set(),
      badChannels: new Set(),
      autoFlagThreshold: DEFAULT_PTP_THRESHOLD_UV,
      showAutoFlagSettings: false,
      showChannelWarning: false,
    };
    this.handleRecordingChange = this.handleRecordingChange.bind(this);
    this.handleLoadData = this.handleLoadData.bind(this);
    this.handleSidebarToggle = this.handleSidebarToggle.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleToggleEpoch = this.handleToggleEpoch.bind(this);
    this.handleToggleChannel = this.handleToggleChannel.bind(this);
    this.handleAutoFlag = this.handleAutoFlag.bind(this);
    this.handleThresholdChange = this.handleThresholdChange.bind(this);
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
    const { value } = e.target;
    if (!isNil(value) && isString(value)) {
      this.setState({ selectedSubject: value, selectedFilePaths: [] });
    }
  }

  handleLoadData() {
    this.props.ExperimentActions.SetSubject(this.state.selectedSubject);
    this.props.PyodideActions.LoadEpochs(this.state.selectedFilePaths);
    // A fresh dataset invalidates any previously selected epoch indices and
    // bad-channel selections.
    this.setState({ rejectedEpochs: new Set(), badChannels: new Set() });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.suggestedRejections !== this.props.suggestedRejections) {
      const suggested = this.props.suggestedRejections;
      if (suggested.length > 0) {
        this.setState((prev) => {
          const next = new Set(prev.rejectedEpochs);
          for (const s of suggested) next.add(s.index);
          return { rejectedEpochs: next };
        });
      }
    }
  }

  handleToggleEpoch(index: number) {
    this.setState((prev) => {
      const next = new Set(prev.rejectedEpochs);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return { rejectedEpochs: next };
    });
  }

  handleToggleChannel(name: string) {
    this.setState((prev) => {
      const next = new Set(prev.badChannels);
      const adding = !next.has(name);
      if (adding) {
        next.add(name);
      } else {
        next.delete(name);
      }
      const nCh = this.props.epochArrays?.meta.n_channels ?? 0;
      // Dropping >1 of a 4-channel (Muse) recording loses a lot of signal —
      // warn (informational; they can still proceed).
      const warn = adding && next.size > 1 && nCh === 4;
      return {
        badChannels: next,
        showChannelWarning: warn || prev.showChannelWarning,
      };
    });
  }

  handleAutoFlag() {
    this.props.PyodideActions.GetSuggestedRejections(
      this.state.autoFlagThreshold
    );
  }

  handleThresholdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseFloat(e.target.value);
    if (!Number.isNaN(parsed)) {
      this.setState({ autoFlagThreshold: parsed });
    }
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
              <span>{this.icons[index]}</span> {infoObj.name}
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
    // Show whenever epoch stats exist — let the user decide from the numbers,
    // instead of only surfacing the button when the data looked bad (drop >= 2).
    if (!isNil(epochsInfo) && epochsInfo.length > 0) {
      return (
        <Link to="/analyze">
          <Button variant="default">Analyze Dataset</Button>
        </Link>
      );
    }
    return null;
  }

  render() {
    const filteredFilePaths = this.state.eegFilePaths.filter((filepath) => {
      const strVal = filepath.value;
      const subjectFromFilepath = strVal.split(path.sep)[
        strVal.split(path.sep).length - 3
      ];
      return this.state.selectedSubject === subjectFromFilepath;
    });

    const codeToLabel = buildMarkerRegistry(
      this.props.params?.stimuli ?? []
    ).codeToLabel;
    const showAutoFlag = AUTO_FLAG_EXPERIMENTS.has(
      this.props.type as EXPERIMENTS
    );
    const { suggestedRejections } = this.props;

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
                Ready to clean some data? Select a subject and one or more EEG
                recordings, then launch the editor
              </p>
              <h4>Select Subject</h4>
              <select
                className="w-full border border-gray-300 rounded p-1 mb-2"
                value={this.state.selectedSubject}
                onChange={this.handleSubjectChange}
              >
                {this.state.subjects.map((s) => (
                  <option key={s.key} value={s.value}>
                    {s.text}
                  </option>
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
                  <option key={fp.key} value={fp.value}>
                    {fp.text}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={this.handleLoadData}
                >
                  Load Dataset
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  disabled={isNil(this.props.epochsInfo)}
                  onClick={() => {
                    this.props.PyodideActions.CleanEpochs({
                      dropIndices: Array.from(this.state.rejectedEpochs),
                      badChannels: Array.from(this.state.badChannels),
                    });
                    // After Clean, raw_epochs is re-fetched with fewer epochs,
                    // so the old absolute indices no longer apply.
                    this.setState({
                      rejectedEpochs: new Set(),
                      badChannels: new Set(),
                    });
                  }}
                >
                  Clean Data
                </Button>
              </div>
              {showAutoFlag && (
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={isNil(this.props.epochsInfo)}
                      onClick={this.handleAutoFlag}
                    >
                      Auto-flag artifacts
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Auto-flag settings"
                      onClick={() =>
                        this.setState((prev) => ({
                          showAutoFlagSettings: !prev.showAutoFlagSettings,
                        }))
                      }
                    >
                      ⚙︎
                    </Button>
                  </div>
                  {this.state.showAutoFlagSettings && (
                    <div className="mt-2 text-left">
                      <label className="text-sm font-medium">
                        Peak-to-peak threshold (µV)
                        <input
                          type="number"
                          className="ml-2 w-24 border border-gray-300 rounded p-1"
                          value={this.state.autoFlagThreshold}
                          onChange={this.handleThresholdChange}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Flag epochs whose peak-to-peak amplitude exceeds this.
                        Higher = fewer flags.
                      </p>
                    </div>
                  )}
                  {suggestedRejections.length > 0 && (
                    <div className="mt-2 text-left text-sm text-brand">
                      <p className="font-medium">
                        Flagged {suggestedRejections.length}{' '}
                        {suggestedRejections.length === 1 ? 'epoch' : 'epochs'}
                      </p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {suggestedRejections.slice(0, 3).map((s, i) => (
                          <li key={`${s.index}-${s.channel}-${i}`}>
                            {s.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-4/12">
              {this.renderEpochLabels()}
              {this.renderAnalyzeButton()}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <EpochReviewer
              epochArrays={this.props.epochArrays}
              rejected={this.state.rejectedEpochs}
              onToggleEpoch={this.handleToggleEpoch}
              badChannels={this.state.badChannels}
              onToggleChannel={this.handleToggleChannel}
              codeToLabel={codeToLabel}
            />
            <LiveErpPane
              epochArrays={this.props.epochArrays}
              rejected={this.state.rejectedEpochs}
              codeToLabel={codeToLabel}
            />
          </div>
        </div>
        <Dialog
          open={this.state.showChannelWarning}
          onOpenChange={(o) => this.setState({ showChannelWarning: o })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>That&apos;s a lot of channels to drop</DialogTitle>
              <DialogDescription>
                You&apos;ve marked more than one bad channel on a 4-channel
                recording. That removes a big chunk of your data — if the signal
                is really this noisy, consider collecting another dataset.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end">
              <Button
                variant="default"
                onClick={() => this.setState({ showChannelWarning: false })}
              >
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}
