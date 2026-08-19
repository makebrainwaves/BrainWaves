import React, { useState, useEffect } from 'react';
import { isNil } from 'lodash';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { Observable } from 'rxjs';
import {
  EXPERIMENTS,
  SCREENS,
  CONNECTION_STATUS,
  DEVICE_AVAILABILITY,
  DEVICES,
} from '../../constants/constants';
import faceHouseIcon from '../../experiments/faces_houses/icon.png';
import stroopIcon from '../../experiments/stroop/icon.png';
import multitaskingIcon from '../../experiments/multitasking/icon.png';
import searchIcon from '../../experiments/search/icon.png';
import customIcon from '../../experiments/custom/icon.png';
import appLogo from '../../assets/common/app_logo.png';
import divingMan from '../../assets/common/divingMan.svg';
import {
  readWorkspaces,
  readAndParseState,
  openWorkspaceDir,
  deleteWorkspaceDir,
} from '../../utils/filesystem/storage';
import { ExperimentStateType } from '../../reducers/experimentReducer';
import {
  PyodideActions,
  DeviceActions,
  ExperimentActions,
} from '../../actions';
import { ExperimentCard } from './ExperimentCard';
import InputModal from '../InputModal';
import SecondaryNavComponent from '../SecondaryNavComponent';
import OverviewComponent from './OverviewComponent';
import EEGExplorationComponent from '../EEGExplorationComponent';
import {
  Device,
  DeviceInfo,
  SignalQualityData,
} from '../../constants/interfaces';
import type { DiscoveredStream } from '../../../shared/lslTypes';
import { getExperimentFromType } from '../../utils/labjs/functions';

const HOME_STEPS = {
  RECENT: 'MY EXPERIMENTS',
  NEW: 'EXPERIMENT BANK',
  EXPLORE: 'EXPLORE EEG DATA',
};

export interface Props {
  activeStep?: string;
  availableDevices: Array<Device>;
  availableLSLStreams: Array<DiscoveredStream>;
  connectedDevice: DeviceInfo | null | undefined;
  connectionStatus: CONNECTION_STATUS;
  DeviceActions: typeof DeviceActions;
  deviceAvailability: DEVICE_AVAILABILITY;
  deviceType: DEVICES;
  ExperimentActions: typeof ExperimentActions;
  navigate: (path: string) => void;
  PyodideActions: typeof PyodideActions;
  signalQualityObservable?: Observable<SignalQualityData>;
}

export default function Home(props: Props) {
  const [activeStep, setActiveStep] = useState(props.activeStep || HOME_STEPS.RECENT);
  const [recentWorkspaces, setRecentWorkspaces] = useState<Array<string>>([]);
  const [workspaceStates, setWorkspaceStates] = useState<Record<string, ExperimentStateType | null>>({});
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] = useState(false);
  const [isOverviewComponentOpen, setIsOverviewComponentOpen] = useState(false);
  const [overviewExperimentType, setOverviewExperimentType] = useState(EXPERIMENTS.NONE);

  useEffect(() => {
    let cancelled = false;
    props.PyodideActions.Launch();
    readWorkspaces().then((workspaces) => {
      if (cancelled) return;
      setRecentWorkspaces(workspaces);
      return loadWorkspaceStates(workspaces);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWorkspaceStates(workspaces: string[]) {
    const entries = await Promise.all(
      workspaces.map(
        async (dir) => [dir, await readAndParseState(dir)] as const
      )
    );
    setWorkspaceStates(Object.fromEntries(entries));
  }

  function handleStepClick(step: string) {
    setActiveStep(step);
  }

  function handleNewExperiment(experimentType: EXPERIMENTS) {
    if (experimentType === EXPERIMENTS.CUSTOM) {
      setIsNewExperimentModalOpen(true);
    } else if (recentWorkspaces.includes(experimentType)) {
      handleLoadRecentWorkspace(experimentType);
    } else {
      props.ExperimentActions.CreateNewWorkspace({
        title: experimentType,
        type: experimentType,
      });
      props.navigate(SCREENS.DESIGN.route);
    }
  }

  function handleLoadCustomExperiment(title: string) {
    title = title.replace(/ /g, '_');
    setIsNewExperimentModalOpen(false);
    if (recentWorkspaces.includes(title)) {
      toast.error(`Experiment already exists`);
      return;
    }
    if (title.length <= 3) {
      toast.error(`Experiment name is too short`);
      return;
    }
    props.ExperimentActions.CreateNewWorkspace({
      title,
      type: EXPERIMENTS.CUSTOM,
    });
    props.navigate(SCREENS.DESIGN.route);
  }

  async function handleLoadRecentWorkspace(dir: string) {
    const recentWorkspaceState = await readAndParseState(dir);
    if (recentWorkspaceState == null) {
      await deleteWorkspaceDir(dir);
      const workspaces = await readWorkspaces();
      setRecentWorkspaces(workspaces);
      await loadWorkspaceStates(workspaces);
      toast(`Removed unreadable experiment "${dir}"`);
      return;
    }
    const deserializedWorkspaceState = {
      ...recentWorkspaceState,
      experimentObject: getExperimentFromType(recentWorkspaceState.type)
        .experimentObject,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.ExperimentActions.SetState(deserializedWorkspaceState as any);
    props.navigate(SCREENS.DESIGN.route);
  }

  function handleOpenOverview(type: EXPERIMENTS) {
    setOverviewExperimentType(type);
    setIsOverviewComponentOpen(true);
  }

  function handleCloseOverview() {
    setIsOverviewComponentOpen(false);
  }

  async function handleDeleteWorkspace(dir) {
    const options = {
      buttons: ['No', 'Yes'],
      message: 'Do you really want to delete the experiment?',
    };
    const response = await window.electronAPI.showMessageBox(options);
    if (response.response === 1) {
      await deleteWorkspaceDir(dir);
      const workspaces = await readWorkspaces();
      setRecentWorkspaces(workspaces);
      await loadWorkspaceStates(workspaces);
    }
  }

  function renderSectionContent() {
    switch (activeStep) {
      case HOME_STEPS.RECENT:
        return (
          <div className="pt-[50px]">
            {recentWorkspaces.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] px-6 py-2 text-sm font-semibold text-[#666]">
                  <span>Experiment name</span>
                  <span>Date Last Opened</span>
                  <span className="min-w-[495px]">Actions</span>
                </div>
                {recentWorkspaces
                  .sort((a, b) => {
                    const aTime =
                      workspaceStates[a]?.dateModified || 0;
                    const bTime =
                      workspaceStates[b]?.dateModified || 0;
                    return bTime - aTime;
                  })
                  .map((dir) => {
                    const workspaceState = workspaceStates[dir];
                    if (!workspaceState) return undefined;
                    const { dateModified } = workspaceState;
                    return (
                      <Card
                        key={dir}
                        className="grid grid-cols-[1fr_1fr_auto] items-center px-6 py-3 rounded"
                      >
                        <span className="text-lg">{dir}</span>
                        <span className="text-lg">
                          {dateModified && dayjs(dateModified).fromNow()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteWorkspace(dir)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => openWorkspaceDir(dir)}
                          >
                            Go to Folder
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => handleLoadRecentWorkspace(dir)}
                          >
                            Open Experiment
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center mt-[50px]">
                <img src={divingMan} className="mx-auto" alt="No experiments" />
                <h2 className="font-normal text-2xl leading-[29px] tracking-[-0.2px] text-[#1a1a1a] mt-4">
                  You don&apos;t have any experiments yet
                </h2>
                <p className="text-lg text-[#1a1a1a] tracking-[-0.2px]">
                  Head over to the &quot;Experiment Bank&quot; section to start
                  an experiment.
                </p>
                <Button
                  variant="default"
                  onClick={() => handleStepClick('EXPERIMENT BANK')}
                >
                  View Experiments
                </Button>
              </div>
            )}
          </div>
        );
      case HOME_STEPS.NEW:
      default:
        return (
          <div className="grid grid-cols-2 gap-4 p-4">
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.N170)}
              icon={faceHouseIcon}
              title="Faces/Houses"
              description={`Explore how people react to different kinds of
                        images, like faces vs. houses.`}
            />
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.STROOP)}
              icon={stroopIcon}
              title="Stroop"
              description={`Investigate why it is hard to deal with
                        contradictory information (like the word "RED"
                        printed in blue).`}
            />
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.MULTI)}
              icon={multitaskingIcon}
              title="Multi-tasking"
              description={`Explore why it is challenging to carry out multiple
                        tasks at the same time.`}
            />
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.SEARCH)}
              icon={searchIcon}
              title="Visual Search"
              description={`Examine why it is difficult to find your keys in a
                        messy room.`}
            />
            <ExperimentCard
              onClick={() => handleNewExperiment(EXPERIMENTS.CUSTOM)}
              icon={customIcon}
              title="Custom"
              description={`Design your own image experiment. Choose
                        condition folders and key responses.`}
            />
          </div>
        );
      case HOME_STEPS.EXPLORE:
        return (
          <EEGExplorationComponent
            connectedDevice={props.connectedDevice}
            signalQualityObservable={props.signalQualityObservable}
            deviceType={props.deviceType}
            deviceAvailability={props.deviceAvailability}
            connectionStatus={props.connectionStatus}
            availableDevices={props.availableDevices}
            availableLSLStreams={props.availableLSLStreams}
            DeviceActions={props.DeviceActions}
          />
        );
    }
  }

  if (isOverviewComponentOpen) {
    return (
      <OverviewComponent
        type={overviewExperimentType}
        onStartExperiment={handleNewExperiment}
        onCloseOverview={handleCloseOverview}
      />
    );
  }

  return (
    <div
      className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]"
      data-tid="container"
    >
      <SecondaryNavComponent
        title={<img src={appLogo} alt="BrainWaves" />}
        steps={HOME_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
      />
      <div className="pt-5 h-full overflow-y-auto">
        {renderSectionContent()}
      </div>
      <InputModal
        open={isNewExperimentModalOpen}
        onClose={handleLoadCustomExperiment}
        onExit={() => setIsNewExperimentModalOpen(false)}
        header="Enter a title for this experiment"
      />
    </div>
  );
}