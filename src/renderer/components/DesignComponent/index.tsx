import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { EXPERIMENTS } from '../../constants/constants';
import { readWorkspaces } from '../../utils/filesystem/storage';
import {
  ExperimentObject,
  ExperimentParameters,
} from '../../constants/interfaces';
import SecondaryNavComponent from '../SecondaryNavComponent';
import PreviewExperimentComponent from '../PreviewExperimentComponent';
import CustomDesign from './CustomDesignComponent';
import ImportedDesign from './ImportedDesignComponent';

import facesHousesOverview from '../../experiments/faces_houses/icon.png';
import stroopOverview from '../../experiments/stroop/icon.png';
import multitaskingOverview from '../../experiments/multitasking/icon.png';
import searchOverview from '../../experiments/search/icon.png';

import multiConditionShape from '../../experiments/multitasking/stimuli/multiConditionShape.png';
import multiConditionDots from '../../experiments/multitasking/stimuli/multiConditionDots.png';
import conditionFace from '../../experiments/faces_houses/stimuli/faces/Face1.jpg';
import conditionHouse from '../../experiments/faces_houses/stimuli/houses/House1.jpg';
import conditionOrangeT from '../../experiments/search/stimuli/conditionOrangeT.png';
import conditionNoOrangeT from '../../experiments/search/stimuli/conditionNoOrangeT.png';
import conditionCongruent from '../../experiments/stroop/stimuli/match_g.png';
import conditionIncongruent from '../../experiments/stroop/stimuli/mismatch6_r.png';

import InputModal from '../InputModal';
import { ExperimentActions } from '../../actions';
import { getExperimentFromType } from '../../utils/labjs/functions';

const DESIGN_STEPS = {
  OVERVIEW: 'OVERVIEW',
  BACKGROUND: 'BACKGROUND',
  PROTOCOL: 'PROTOCOL',
  PREVIEW: 'PREVIEW',
};

export interface DesignProps {
  navigate: (path: string) => void;
  type: EXPERIMENTS;
  title: string;
  params: ExperimentParameters;
  experimentObject: ExperimentObject;
  ExperimentActions: typeof ExperimentActions;
  isEEGEnabled: boolean;
}

function renderConditionIcon(condition) {
  switch (condition) {
    case 'conditionCongruent':
      return conditionCongruent;
    case 'conditionIncongruent':
      return conditionIncongruent;
    case 'conditionOrangeT':
      return conditionOrangeT;
    case 'conditionNoOrangeT':
      return conditionNoOrangeT;
    case 'conditionFace':
      return conditionFace;
    case 'conditionHouse':
      return conditionHouse;
    case 'multiConditionShape':
      return multiConditionShape;
    case 'multiConditionDots':
    default:
      return multiConditionDots;
  }
}

function renderOverviewIcon(type: EXPERIMENTS): string | undefined {
  switch (type) {
    case EXPERIMENTS.N170:
      return facesHousesOverview;
    case EXPERIMENTS.STROOP:
      return stroopOverview;
    case EXPERIMENTS.MULTI:
      return multitaskingOverview;
    case EXPERIMENTS.SEARCH:
      return searchOverview;
    default:
      return undefined;
  }
}

export default function Design(props: DesignProps) {
  const [activeStep, setActiveStep] = useState(DESIGN_STEPS.OVERVIEW);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isNewExperimentModalOpen, setIsNewExperimentModalOpen] =
    useState(false);
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    readWorkspaces().then((workspaces) => {
      if (!cancelled) setRecentWorkspaces(workspaces);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (props.type === EXPERIMENTS.CUSTOM) {
    return <CustomDesign {...props} />;
  }

  if (props.type === EXPERIMENTS.IMPORTED) {
    return <ImportedDesign {...props} />;
  }

  function handleLoadCustomExperiment(title: string) {
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
    props.ExperimentActions.SaveWorkspace();
  }

  function handlePreview(event: React.MouseEvent<HTMLButtonElement>) {
    event.currentTarget.blur();
    setIsPreviewing((previewing) => !previewing);
  }

  function handleEEGEnabled(enabled: boolean) {
    props.ExperimentActions.SetEEGEnabled(enabled);
    props.ExperimentActions.SaveWorkspace();
  }

  function renderSectionContent() {
    const {
      text: { overview, protocol, background },
    } = getExperimentFromType(props.type);
    const overviewIcon = renderOverviewIcon(props.type);

    switch (activeStep) {
      case DESIGN_STEPS.BACKGROUND:
        return (
          <section className="flex flex-col gap-5">
            <header className="flex max-w-[680px] flex-col gap-2.5">
              <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                BACKGROUND · 2 MIN READ
              </span>
              <h1 className="[text-wrap:pretty]">
                {background.title ?? 'Background'}
              </h1>
            </header>
            <p className="experiment-design-copy max-w-[680px]">
              {background.first_column_statement}
            </p>
            {background.first_column_question && (
              <div className="flex max-w-[680px] items-start gap-5 rounded-lg border border-[#ececf1] bg-white p-6">
                {overviewIcon && (
                  <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-lg border border-[#f6ead3] bg-[#fffaf0]">
                    <img src={overviewIcon} alt="" className="max-w-11" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-normal">
                    {background.definition_title ?? 'What researchers found'}
                  </h2>
                  <p className="experiment-design-card-copy">
                    {background.first_column_question}
                  </p>
                </div>
              </div>
            )}
            {(background.second_column_statement ||
              background.second_column_question) && (
              <div className="flex max-w-[680px] items-center gap-5 rounded-lg border border-[#e3def7] bg-[#f4f2ff] px-6 py-5">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-[13px] font-bold tracking-[0.5px] text-[#4a3fa8]">
                    FUN FACT
                  </span>
                  <p className="experiment-design-card-copy">
                    {[
                      background.second_column_statement,
                      background.second_column_question,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
                {background.fun_fact_image && (
                  <img
                    src={background.fun_fact_image}
                    alt=""
                    className="w-[88px] flex-none"
                  />
                )}
              </div>
            )}
            {background.links.map((link) => (
              <div
                key={link.address}
                className="flex flex-wrap items-center gap-4"
              >
                <Button
                  variant="outline-brand"
                  onClick={() => window.open(link.address, '_blank')}
                >
                  {link.name}
                </Button>
                {background.link_meta && (
                  <span className="text-[15px] text-ink-muted">
                    {background.link_meta}
                  </span>
                )}
              </div>
            ))}
          </section>
        );

      case DESIGN_STEPS.PROTOCOL:
        return (
          <section className="flex flex-col gap-5">
            <header className="flex max-w-[680px] flex-col gap-2.5">
              <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                PROTOCOL
              </span>
              <h1 className="[text-wrap:pretty]">{protocol.title}</h1>
              <p className="experiment-design-copy">{protocol.protocol}</p>
            </header>
            <div className="grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              {[
                {
                  image: protocol.condition_first_img,
                  title: protocol.condition_first_title,
                  description: protocol.condition_first,
                  key: protocol.condition_first_key,
                },
                {
                  image: protocol.condition_second_img,
                  title: protocol.condition_second_title,
                  description: protocol.condition_second,
                  key: protocol.condition_second_key,
                },
              ].map((condition) => (
                <article
                  key={condition.title}
                  className="flex flex-col items-start gap-3.5 rounded-lg border border-[#ececf1] bg-white p-5"
                >
                  <img
                    className="h-[150px] w-full rounded-md object-cover"
                    src={renderConditionIcon(condition.image)}
                    alt={condition.title}
                  />
                  <h2 className="text-xl font-normal">{condition.title}</h2>
                  <p className="experiment-design-card-copy">
                    {condition.description}{' '}
                    {condition.key && (
                      <kbd className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-md border-2 border-ink text-[15px] font-bold">
                        {condition.key}
                      </kbd>
                    )}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );

      case DESIGN_STEPS.PREVIEW:
        return (
          <section className="flex flex-col gap-5">
            <header className="flex max-w-[680px] flex-col gap-2.5">
              <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                PREVIEW
              </span>
              <h1 className="[text-wrap:pretty]">See it the way they will</h1>
            </header>
            <div className="h-[330px] w-full max-w-[1100px] rounded-lg border-2 border-brand bg-white">
              <PreviewExperimentComponent
                title={props.title}
                params={props.params}
                experimentObject={props.experimentObject}
                isPreviewing={isPreviewing}
                onEnd={() => setIsPreviewing(false)}
                type={props.type}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                variant={isPreviewing ? 'destructive' : 'default'}
                onClick={handlePreview}
              >
                {isPreviewing ? 'Stop Preview' : 'Preview Experiment'}
              </Button>
              <span className="text-[15px] text-ink-muted">
                Nothing is recorded during a preview.
              </span>
            </div>
          </section>
        );

      case DESIGN_STEPS.OVERVIEW:
      default:
        return (
          <section className="flex flex-wrap-reverse items-start gap-12">
            <div className="flex min-w-0 max-w-[680px] flex-[1_1_420px] flex-col gap-3.5">
              <span className="text-[13px] font-bold tracking-[0.5px] text-ink-muted">
                THE BIG QUESTION
              </span>
              <h1 className="[text-wrap:pretty]">{overview.title}</h1>
              {overview.overview.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph} className="experiment-design-copy">
                  {paragraph}
                </p>
              ))}
            </div>
            {overviewIcon && (
              <div className="flex flex-[0_1_260px] items-center justify-center pt-2">
                <img
                  src={overviewIcon}
                  alt={overview.title}
                  className="h-auto w-full max-w-60"
                />
              </div>
            )}
          </section>
        );
    }
  }

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col overflow-hidden bg-white">
      <SecondaryNavComponent
        title="Experiment Design"
        steps={DESIGN_STEPS}
        activeStep={activeStep}
        onStepClick={setActiveStep}
        isEEGEnabled={props.isEEGEnabled}
        onEEGEnabledChange={handleEEGEnabled}
        onCustomize={() => setIsNewExperimentModalOpen(true)}
      />
      <main className="experiment-design-content min-h-0 flex-1 overflow-y-auto bg-app">
        <div className="w-full px-9 pb-12 pt-9">{renderSectionContent()}</div>
      </main>
      <InputModal
        open={isNewExperimentModalOpen}
        onClose={handleLoadCustomExperiment}
        onExit={() => setIsNewExperimentModalOpen(false)}
        header="Enter a title for this experiment"
      />
    </div>
  );
}
