import React, { Component } from 'react';
import path from 'pathe';
import { Link } from 'react-router-dom';
import { isNil, isString, memoize } from 'lodash';
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
  getPtpThresholdPreset,
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

// Memoized by stimuli reference so we don't rebuild the registry every render.
const codeToLabelFor = memoize(
  (stimuli: ExperimentParameters['stimuli']) =>
    buildMarkerRegistry(stimuli).codeToLabel
);

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
  // Which screen is showing: dataset picker vs. the interactive editor.
  view: 'select' | 'review';
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
      view: 'select',
      subjects: [],
      eegFilePaths: [{ key: '', text: '', value: '' }],
      selectedFilePaths: [],
      selectedSubject: props.subject,
      isSidebarVisible: false,
      rejectedEpochs: new Set(),
      badChannels: new Set(),
      autoFlagThreshold: getPtpThresholdPreset(props.deviceType).default,
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
    this.handleCleanData = this.handleCleanData.bind(this);
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
    // Launch the editor; a fresh dataset invalidates any previously selected
    // epoch indices and bad-channel selections.
    this.setState({
      view: 'review',
      rejectedEpochs: new Set(),
      badChannels: new Set(),
    });
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

  async handleCleanData() {
    const total = this.props.epochArrays?.meta.n_epochs ?? 0;
    const nDropped = this.state.rejectedEpochs.size;
    // Rejecting every epoch produces an empty dataset that can't be analyzed
    // (and previously wrote a degenerate .fif with no error). Warn first.
    if (total > 0 && nDropped >= total) {
      const response = await window.electronAPI.showMessageBox({
        buttons: ['Cancel', 'Reject all anyway'],
        message: `This will reject all ${total} epochs, leaving nothing to analyze. Are you sure?`,
      });
      if (response.response !== 1) {
        return;
      }
    }
    this.props.PyodideActions.CleanEpochs({
      dropIndices: Array.from(this.state.rejectedEpochs),
      badChannels: Array.from(this.state.badChannels),
    });
    // After Clean, raw_epochs is re-fetched with fewer epochs, so the old
    // absolute indices no longer apply.
    this.setState({
      rejectedEpochs: new Set(),
      badChannels: new Set(),
    });
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

  renderStats() {
    const { epochsInfo } = this.props;
    if (isNil(epochsInfo) || epochsInfo.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {epochsInfo.map((infoObj, index) => (
          <span key={String(infoObj.name)} className="whitespace-nowrap">
            <span className="mr-1">{this.icons[index]}</span>
            <span className="text-gray-500">{infoObj.name}:</span>{' '}
            <span className="font-medium">{infoObj.value}</span>
          </span>
        ))}
      </div>
    );
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

  renderSelect(filteredFilePaths: DropdownOption[]) {
    return (
      <div className="max-w-2xl text-left">
        <h1>Clean</h1>
        <h4 className="mt-2">Select &amp; Clean</h4>
        <p>
          Ready to clean some data? Pick a subject and one or more EEG
          recordings, then launch the editor.
        </p>
        <h4 className="mt-4">Select Subject</h4>
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
        <Button
          variant="default"
          className="mt-4 w-full"
          disabled={this.state.selectedFilePaths.length === 0}
          onClick={this.handleLoadData}
        >
          Load Dataset →
        </Button>
      </div>
    );
  }

  renderReview(
    codeToLabel: Record<number, string>,
    showAutoFlag: boolean,
    suggestedRejections: SuggestedRejection[]
  ) {
    const hasEpochs = !isNil(this.props.epochArrays);
    const nRecordings = this.state.selectedFilePaths.length;
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => this.setState({ view: 'select' })}
          >
            ← Datasets
          </Button>
          <h1 className="m-0">Clean</h1>
          <span className="text-sm text-gray-500">
            {this.state.selectedSubject} · {nRecordings} recording
            {nRecordings === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            variant="default"
            disabled={isNil(this.props.epochsInfo)}
            onClick={this.handleCleanData}
          >
            Clean Data
          </Button>
          {showAutoFlag && (
            <>
              <Button
                variant="secondary"
                disabled={isNil(this.props.epochsInfo)}
                onClick={this.handleAutoFlag}
              >
                Auto-flag artifacts
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Auto-flag settings"
                onClick={() =>
                  this.setState((prev) => ({
                    showAutoFlagSettings: !prev.showAutoFlagSettings,
                  }))
                }
              >
                ⚙︎
              </Button>
            </>
          )}
          <div className="ml-auto">{this.renderAnalyzeButton()}</div>
        </div>

        {showAutoFlag &&
          this.state.showAutoFlagSettings &&
          (() => {
            const preset = getPtpThresholdPreset(this.props.deviceType);
            return (
              <div className="mb-3 text-left">
                <label
                  className="text-sm font-medium block"
                  htmlFor="autoflag-sensitivity"
                >
                  Auto-flag threshold
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">More flags</span>
                  <input
                    id="autoflag-sensitivity"
                    type="range"
                    min={preset.min}
                    max={preset.max}
                    step={preset.step}
                    value={this.state.autoFlagThreshold}
                    aria-valuetext={`${this.state.autoFlagThreshold} µV peak-to-peak`}
                    onChange={this.handleThresholdChange}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500">Fewer flags</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Flag epochs whose peak-to-peak amplitude exceeds{' '}
                  <span className="font-medium">
                    {this.state.autoFlagThreshold} µV
                  </span>
                  .
                </p>
              </div>
            );
          })()}
        {suggestedRejections.length > 0 && (
          <div className="mb-3 text-left text-sm text-brand">
            <p className="font-medium">
              Flagged {suggestedRejections.length}{' '}
              {suggestedRejections.length === 1 ? 'epoch' : 'epochs'}
            </p>
            <ul className="text-xs text-gray-600 list-disc list-inside">
              {suggestedRejections.slice(0, 3).map((s, i) => (
                <li key={`${s.index}-${s.channel}-${i}`}>{s.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4">{this.renderStats()}</div>

        {hasEpochs ? (
          <div className="flex flex-wrap gap-6">
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
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white/50 text-brand">
            Loading your epochs… 🧠
          </div>
        )}
      </>
    );
  }

  render() {
    const filteredFilePaths = this.state.eegFilePaths.filter((filepath) => {
      const strVal = filepath.value;
      const subjectFromFilepath = strVal.split(path.sep)[
        strVal.split(path.sep).length - 3
      ];
      return this.state.selectedSubject === subjectFromFilepath;
    });

    const codeToLabel = codeToLabelFor(this.props.params?.stimuli);
    const showAutoFlag = !this.props.params?.hideAutoFlagEpochs;
    const { suggestedRejections } = this.props;

    return (
      <div className="relative flex h-screen bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
        {this.state.isSidebarVisible && (
          <div className="absolute right-0 top-0 h-full w-64 z-10">
            <CleanSidebar handleClose={this.handleSidebarToggle} />
          </div>
        )}
        <div className="flex-1 p-[3%] overflow-y-auto">
          {this.state.view === 'select'
            ? this.renderSelect(filteredFilePaths)
            : this.renderReview(codeToLabel, showAutoFlag, suggestedRejections)}
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
