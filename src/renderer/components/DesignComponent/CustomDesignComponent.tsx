import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { isString } from 'lodash';

import { SCREENS } from '../../constants/constants';
import { ExperimentParameters, Stimulus } from '../../constants/interfaces';
import { DesignProps } from './index';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import { ParamSlider } from './ParamSlider';
import PreviewButton from '../PreviewButtonComponent';
import StimuliDesignColumn from './StimuliDesignColumn';
import { StimuliRow } from './StimuliRow';
import { readImages, readAudioFiles } from '../../utils/filesystem/storage';
import {
  CONDITION_SLOTS,
  ConditionSlotName,
  assignDefaultResponses,
  conditionTitle,
  countPhases,
  emptyConditionSlot,
  rebuildStimuliFromSlots,
  titleFromFolder,
} from '../../utils/labjs/customStimuli';
import {
  mergeCustomParams,
  params as defaultCustomParams,
} from '../../experiments/custom/params';
import researchQuestionImage from '../../assets/common/ResearchQuestion2.png';
import methodsImage from '../../assets/common/Methods2.png';
import hypothesisImage from '../../assets/common/Hypothesis2.png';

const CUSTOM_STEPS = {
  OVERVIEW: 'OVERVIEW',
  CONDITIONS: 'CONDITIONS',
  TRIALS: 'TRIALS',
  PARAMETERS: 'PARAMETERS',
  INSTRUCTIONS: 'INSTRUCTIONS',
  PREVIEW: 'PREVIEW',
};

export default function CustomDesign(props: DesignProps) {
  const [activeStep, setActiveStep] = useState(CUSTOM_STEPS.OVERVIEW);
  const [isPreviewing, setIsPreviewing] = useState(true);
  const [params, setParams] = useState(() => mergeCustomParams(props.params));
  const [saved, setSaved] = useState(false);

  // Keep a ref always in sync with the latest params so async handlers and
  // unmount effects read current state instead of a stale closure value.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Guards against an older folder scan landing after a newer one; only the
  // most recent scan is allowed to rewrite the trial list.
  const conditionRevisionRef = useRef(0);

  useEffect(() => {
    return () => {
      props.ExperimentActions.SetParams(paramsRef.current);
      props.ExperimentActions.SaveWorkspace();
    };
  }, [props.ExperimentActions]);

  /**
   * The single write path for experiment parameters. `params` state is the
   * only copy: every handler derives its update from it, so a setting changed
   * on one step can never be resurrected from a stale snapshot held by another.
   */
  function handleSaveParams(
    newParams: ExperimentParameters = paramsRef.current
  ) {
    props.ExperimentActions.SetParams(newParams);
    props.ExperimentActions.SaveWorkspace();
    setSaved(true);
    setParams(newParams);
  }

  function handleStepClick(step: string) {
    handleSaveParams();
    setActiveStep(step);
  }

  function handleProgressBar(e: React.ChangeEvent<HTMLInputElement>) {
    const { checked } = e.target;
    setParams((prev) => ({
      ...prev,
      showProgressBar: checked,
    }));
  }

  function handleEEGEnabled(e: React.ChangeEvent<HTMLInputElement>) {
    props.ExperimentActions.SetEEGEnabled(e.target.checked);
  }

  function handleStartExperiment() {
    props.navigate(SCREENS.COLLECT.route);
  }

  function handlePreview(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.blur();
    setIsPreviewing((prev) => !prev);
  }

  function endPreview() {
    setIsPreviewing(false);
  }

  const handleTrialCountChange =
    (field: 'nbTrials' | 'nbPracticeTrials') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const parsed = raw === '' ? 0 : parseInt(raw, 10);
      const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      setParams((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    };

  const handleSetInstruction =
    (field: 'intro' | 'taskHelp') =>
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (!isString(value)) return;
      setParams((prev) => ({ ...prev, [field]: value }));
      setSaved(false);
    };

  function handleSetText(
    text: string,
    section: 'hypothesis' | 'methods' | 'question'
  ) {
    const newParams: ExperimentParameters = {
      ...paramsRef.current,
      description: {
        ...defaultCustomParams.description,
        ...paramsRef.current.description,
        [section]: text,
      },
    };
    setParams(newParams);
    setSaved(false);
    handleSaveParams(newParams);
  }

  const handleConditionChange = async (
    key: string,
    data: string,
    changedName: string
  ) => {
    const slotName = changedName as ConditionSlotName;
    const slotMeta = CONDITION_SLOTS.find((slot) => slot.name === slotName);
    if (!slotMeta) return;
    const isFolderChange = key === 'dir' || key === 'audioDir';

    const applySlotEdit = (
      previous: ExperimentParameters
    ): ExperimentParameters => {
      const previousSlot =
        previous[slotName] ?? emptyConditionSlot(slotMeta.type, '');
      const nextParams: ExperimentParameters = {
        ...previous,
        [slotName]: {
          ...previousSlot,
          [key]: data,
          // Picking a folder names the condition after it, unless the student
          // already typed their own name.
          ...(isFolderChange
            ? { title: titleFromFolder(data, previousSlot.title) }
            : {}),
        },
      };
      return isFolderChange ? assignDefaultResponses(nextParams) : nextParams;
    };

    // A name or key edit can't change which files are in play — just restamp
    // the trials that already belong to this condition.
    if (!isFolderChange) {
      const nextParams = applySlotEdit(paramsRef.current);
      const changedSlot = nextParams[slotName]!;
      handleSaveParams({
        ...nextParams,
        stimuli: (nextParams.stimuli ?? []).map((stimulus) =>
          stimulus.type === slotMeta.type
            ? {
                ...stimulus,
                condition: conditionTitle(changedSlot),
                response: changedSlot.response,
              }
            : stimulus
        ),
      });
      return;
    }

    // Folder changes need the folder contents, so show the new selection first
    // and rebuild the trial list once the scan comes back.
    const pendingParams = applySlotEdit(paramsRef.current);
    setParams(pendingParams);
    setSaved(false);

    const revision = ++conditionRevisionRef.current;
    const rebuiltStimuli = await rebuildStimuliFromSlots(
      pendingParams,
      readImages,
      readAudioFiles
    );
    if (revision !== conditionRevisionRef.current) return;

    // Re-read state: condition names and keys may have been edited while the
    // folder scan was in flight.
    const latestParams = paramsRef.current;
    const stimuli = rebuiltStimuli.map((stimulus) => {
      const slot = CONDITION_SLOTS.find(({ type }) => type === stimulus.type);
      const condition = slot ? latestParams[slot.name] : undefined;
      return condition
        ? {
            ...stimulus,
            condition: conditionTitle(condition),
            response: condition.response,
          }
        : stimulus;
    });
    const { nbTrials, nbPracticeTrials } = countPhases(stimuli);
    handleSaveParams({
      ...latestParams,
      stimuli,
      nbTrials,
      nbPracticeTrials,
    });
  };

  const handleDeleteTrial = (deletedNum: number) => {
    const stimuli = [...(params.stimuli ?? [])];
    stimuli.splice(deletedNum, 1);
    const { nbTrials, nbPracticeTrials } = countPhases(stimuli);
    const newParams: ExperimentParameters = {
      ...params,
      stimuli,
      nbTrials,
      nbPracticeTrials,
    };
    setParams(newParams);
    setSaved(false);
    handleSaveParams(newParams);
  };

  const handleChangeTrial = (changedNum: number, key: string, data: string) => {
    const stimuli: Stimulus[] = [...(params.stimuli ?? [])];
    const current = stimuli[changedNum];
    if (!current) return;
    stimuli[changedNum] = { ...current, [key]: data };
    const { nbTrials, nbPracticeTrials } = countPhases(stimuli);
    const newParams: ExperimentParameters = {
      ...params,
      stimuli,
      nbTrials,
      nbPracticeTrials,
    };
    setParams(newParams);
    setSaved(false);
    handleSaveParams(newParams);
  };

  function renderSectionContent() {
    switch (activeStep) {
      case CUSTOM_STEPS.OVERVIEW:
      default:
        return (
          <div className="flex gap-4 p-4 h-[90%]">
            <div className="w-1/4 p-2">
              <img src={researchQuestionImage} alt="Research Question" />
            </div>
            <div className="flex-1 flex flex-col items-center">
              <h1>Design your own experiment</h1>
              <p>Create your own experiment by following the steps below.</p>
              <div className="mt-4 space-y-4 w-full max-w-lg">
                <div>
                  <h2>Ask a research question</h2>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={4}
                    value={params.description?.question ?? ''}
                    onChange={(event) =>
                      handleSetText(event.target.value, 'question')
                    }
                  />
                </div>
                <div>
                  <h2>Form a hypothesis</h2>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={4}
                    value={params.description?.hypothesis ?? ''}
                    onChange={(event) =>
                      handleSetText(event.target.value, 'hypothesis')
                    }
                  />
                </div>
                <div>
                  <h2>Describe your methods</h2>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={4}
                    value={params.description?.methods ?? ''}
                    onChange={(event) =>
                      handleSetText(event.target.value, 'methods')
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case CUSTOM_STEPS.CONDITIONS:
        return (
          <div className="p-4">
            <div className="mb-4">
              <h1>Conditions</h1>
              <p>
                {`Select the folder with images for each condition and choose
                the correct response.`}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[60px]">Condition</TableHead>
                  <TableHead>Default Key Response</TableHead>
                  <TableHead>Image Folder</TableHead>
                  <TableHead>Sound Folder (optional)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONDITION_SLOTS.map(({ name, number, type }) => {
                  const slot = params[name] ?? emptyConditionSlot(type, '');
                  return (
                    <StimuliDesignColumn
                      key={name}
                      num={number}
                      title={slot.title}
                      response={slot.response}
                      dir={slot.dir ?? ''}
                      audioDir={slot.audioDir ?? ''}
                      numberImages={
                        params.stimuli?.filter((trial) => trial.type === number)
                          .length
                      }
                      onChange={handleConditionChange}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );

      case CUSTOM_STEPS.TRIALS:
        return (
          <div className="p-4">
            <div className="grid grid-cols-[auto_1fr] w-full">
              <div>
                <h1>Trials</h1>
                <p>Edit the correct key response and type of each trial.</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 self-end justify-self-end">
                <div>
                  <label htmlFor="trial-order" className="block text-sm mb-1">
                    Order
                  </label>
                  <select
                    id="trial-order"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={params.randomize}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (val === 'sequential' || val === 'random') {
                        const newParams: ExperimentParameters = {
                          ...params,
                          randomize: val as ExperimentParameters['randomize'],
                        };
                        setParams(newParams);
                        setSaved(false);
                      }
                    }}
                  >
                    <option value="random">Random</option>
                    <option value="sequential">Sequential</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nb-trials" className="block text-sm mb-1">
                    Total experimental trials
                  </label>
                  <input
                    id="nb-trials"
                    type="number"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={
                      Number.isFinite(params.nbTrials) ? params.nbTrials : 0
                    }
                    onChange={handleTrialCountChange('nbTrials')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="nb-practice-trials"
                    className="block text-sm mb-1"
                  >
                    Total practice trials
                  </label>
                  <input
                    id="nb-practice-trials"
                    type="number"
                    className="border border-gray-300 rounded px-2 py-1"
                    value={
                      Number.isFinite(params.nbPracticeTrials)
                        ? params.nbPracticeTrials
                        : 0
                    }
                    onChange={handleTrialCountChange('nbPracticeTrials')}
                  />
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[60px]">Name</TableHead>
                  <TableHead>Sound</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Default Key Response</TableHead>
                  <TableHead>Image File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {params.stimuli?.map((stimulus, i) => (
                  <StimuliRow
                    key={`${stimulus.filename ?? stimulus.title}-${i}`}
                    num={i}
                    name={stimulus.filename ?? stimulus.title}
                    audioFilename={stimulus.audioFilename}
                    response={stimulus.response ?? ''}
                    dir={stimulus.dir ?? ''}
                    condition={stimulus.condition ?? ''}
                    phase={stimulus.phase ?? 'main'}
                    onDelete={() => handleDeleteTrial(i)}
                    onChange={(num, key, data) =>
                      handleChangeTrial(num, key, data)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case CUSTOM_STEPS.PARAMETERS:
        return (
          <div className="flex gap-4 p-4">
            <div className="w-1/2 flex flex-col justify-between">
              <div>
                <h1>Inter-trial interval</h1>
                <p>
                  Select the inter-trial interval duration. This is the amount
                  of time between trials measured from the end of one trial to
                  the start of the next one.
                </p>
              </div>
              <div style={{ marginTop: '100px' }}>
                <ParamSlider
                  label="ITI Duration (seconds)"
                  value={params.iti ?? 500}
                  marks={{
                    1: '0.25',
                    2: '0.5',
                    3: '0.75',
                    4: '1',
                    5: '1.25',
                    6: '1.5',
                    7: '1.75',
                    8: '2',
                  }}
                  msConversion="250"
                  onChange={(value) => {
                    const newParams: ExperimentParameters = {
                      ...params,
                      iti: value,
                    };
                    setParams(newParams);
                    setSaved(false);
                  }}
                />
              </div>
            </div>
            <div className="w-1/2 flex flex-col justify-between">
              <div>
                <h1>Image duration</h1>
                <p>
                  Select the time of presentation or make it self-paced -
                  present the image until participants respond.
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={params.selfPaced}
                    onChange={() => {
                      const newParams: ExperimentParameters = {
                        ...params,
                        selfPaced: !params.selfPaced,
                      };
                      setParams(newParams);
                      setSaved(false);
                    }}
                  />
                  Self-paced data collection
                </label>
              </div>
              {!params.selfPaced ? (
                <div>
                  <ParamSlider
                    label="Presentation time (seconds)"
                    value={params.presentationTime ?? 0}
                    marks={{
                      1: '0.25',
                      2: '0.5',
                      3: '0.75',
                      4: '1',
                      5: '1.25',
                      6: '1.5',
                      7: '1.75',
                      8: '2',
                    }}
                    msConversion="250"
                    onChange={(value) => {
                      const newParams: ExperimentParameters = {
                        ...params,
                        presentationTime: value,
                      };
                      setParams(newParams);
                      setSaved(false);
                    }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '85px' }} />
              )}
            </div>
          </div>
        );

      case CUSTOM_STEPS.INSTRUCTIONS:
        return (
          <div className="p-4">
            <h1>Instructions</h1>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Intro</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  value={params.intro}
                  onChange={handleSetInstruction('intro')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Task help text
                </label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  value={params.taskHelp}
                  onChange={handleSetInstruction('taskHelp')}
                />
              </div>
            </div>
          </div>
        );

      case CUSTOM_STEPS.PREVIEW:
        return (
          <div className="flex items-start p-4 h-[90%]">
            <div className="flex-1 h-full border border-brand rounded">
              {props.type && (
                <PreviewExperimentComponent
                  isPreviewing={isPreviewing}
                  onEnd={endPreview}
                  type={props.type}
                  experimentObject={props.experimentObject}
                  params={params}
                  title={props.title}
                />
              )}
            </div>
            <div className="flex-shrink-0 p-2">
              <PreviewButton
                isPreviewing={isPreviewing}
                onClick={handlePreview}
              />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="h-screen p-[3%] bg-gradient-to-b from-[#f9f9f9] to-[#f0f0ff]">
      <SecondaryNavComponent
        title="Experiment Design"
        steps={CUSTOM_STEPS}
        activeStep={activeStep}
        onStepClick={handleStepClick}
        enableEEGToggle={
          <input
            type="checkbox"
            defaultChecked={props.isEEGEnabled}
            onChange={handleEEGEnabled}
            className="scale-75"
          />
        }
        saveButton={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSaveParams()}
          >
            Save
          </Button>
        }
      />
      {renderSectionContent()}
    </div>
  );
}
