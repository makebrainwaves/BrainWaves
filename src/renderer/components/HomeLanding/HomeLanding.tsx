import React, { useId, useState } from 'react';
import { Button } from '../ui/button';
import { EXPERIMENTS } from '../../constants/constants';
import { ShellWorkspace, workspaceTypeLabel } from '../AppShell/types';
import facesHousesIcon from '../../experiments/faces_houses/icon.png';
import eegArt from '../../assets/common/EEG.png';

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute text-ink-muted"
      style={{ left: 10, width: 14, height: 14 }}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export interface HomeWorkspace extends ShellWorkspace {
  id: string;
  /** Preformatted relative time, e.g. `2 hours ago`. */
  lastOpened: string;
}

interface Props {
  /** Most recent first. Empty = first-time Home. */
  workspaces: HomeWorkspace[];
  onOpen(id: string): void;
  onReveal(id: string): void;
  onDelete(id: string): void;
  /** Should open the naming dialog before creating anything. */
  onStartTemplate(templateId: EXPERIMENTS): void;
  onBrowseTemplates(): void;
  /** Live view only: saves nothing and creates no workspace. */
  onExploreLive(): void;
}

const SECTION_LABEL =
  'm-0 text-[14px] font-bold uppercase tracking-[0.5px] text-ink-muted';
const CARD =
  'flex-1 rounded-[6px] bg-white p-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
const BODY =
  'm-0 !text-[16px] leading-normal !tracking-normal [text-wrap:pretty]';
const CARD_TITLE =
  'm-0 text-[30px] font-light leading-tight tracking-[0.3px]';
const NOTE = 'm-0 !text-[13px] !tracking-normal text-ink-muted';

/**
 * Home: greeting, recent workspaces, a recommended first template and live
 * EEG exploration. First-time and returning users get a different greeting,
 * section order and primary action. New box-model (scroll cap, search field,
 * card split) is inline so a running dev instance applies it without waiting
 * for its Tailwind CSS to regenerate the arbitrary utilities.
 */
export default function HomeLanding({
  workspaces,
  onOpen,
  onReveal,
  onDelete,
  onStartTemplate,
  onBrowseTemplates,
  onExploreLive,
}: Props) {
  const firstTime = workspaces.length === 0;
  const ids = { continue: useId(), start: useId(), live: useId() };
  const [query, setQuery] = useState('');
  const visible = workspaces.filter((w) =>
    w.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const continueSection = (
    <section
      aria-labelledby={ids.continue}
      className="flex flex-col gap-[12px]"
    >
      <div className="flex items-center justify-between">
        <h2 id={ids.continue} className={SECTION_LABEL}>
          Continue your work
        </h2>
        {!firstTime && (
          <label className="relative flex items-center">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search workspaces"
              placeholder="Search"
              className="rounded-[6px] border border-[#d4d4d4] bg-white text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              style={{ height: 30, width: 200, paddingLeft: 32, paddingRight: 8 }}
            />
          </label>
        )}
      </div>
      {firstTime ? (
        <div className="rounded-[6px] bg-[#ececf1] px-[24px] py-[28px] text-[16px]">
          Your workspaces will show up here once you start an experiment.
        </div>
      ) : (
        <ul
          className="m-0 flex flex-col gap-[8px] p-0"
          style={{ maxHeight: 420, overflowY: 'auto' }}
        >
          {visible.map((workspace, i) => (
            <li
              key={workspace.id}
              className="flex items-center gap-[24px] rounded-[6px] border border-[#ececec] bg-white py-[14px] pl-[24px] pr-[16px]"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="truncate text-[18px]">{workspace.name}</span>
                <span className="text-[14px] text-ink-muted">
                  {workspaceTypeLabel(workspace)}
                </span>
              </div>
              <span className="w-[150px] text-[14px] text-ink-muted">
                Opened {workspace.lastOpened}
              </span>
              <div className="flex items-center gap-[4px]">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Show ${workspace.name} in folder`}
                  onClick={() => onReveal(workspace.id)}
                >
                  Show in folder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${workspace.name}`}
                  className="text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(workspace.id)}
                >
                  Delete
                </Button>
                <Button
                  variant={i === 0 ? 'default' : 'outline-brand'}
                  aria-label={`Open ${workspace.name}`}
                  className="ml-[12px] w-[96px]"
                  onClick={() => onOpen(workspace.id)}
                >
                  Open
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!firstTime && visible.length === 0 && (
        <p className={NOTE}>No workspaces match “{query}”.</p>
      )}
    </section>
  );

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-[40px] px-[56px] pb-[64px] pt-[48px] text-ink">
      <div className="flex flex-col gap-[10px]">
        <h1 className="m-0 !text-[40px] !font-light !leading-tight !tracking-[0.4px]">
          {firstTime ? 'Welcome to BrainWaves' : 'Welcome back'}
        </h1>
        <p className="m-0 max-w-[640px] !text-[18px] leading-normal !tracking-normal [text-wrap:pretty]">
          {firstTime
            ? 'Run your first brain experiment today. Most classes start with Faces/Houses — it takes about 15 minutes.'
            : 'Pick up where you left off, or start something new.'}
        </p>
      </div>
      {!firstTime && continueSection}
      <div
        className="grid items-stretch gap-[20px]"
        style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1.2fr)' }}
      >
        <section
          aria-labelledby={ids.start}
          className="flex flex-col gap-[12px]"
        >
          <h2 id={ids.start} className={SECTION_LABEL}>
            Start an experiment
          </h2>
          <div className={`${CARD} flex items-center gap-[28px]`}>
            <img
              src={facesHousesIcon}
              alt=""
              className="h-[168px] w-[168px] flex-none object-contain"
            />
            <div className="flex min-w-0 flex-col items-start gap-[10px]">
              <span className="flex items-center gap-[6px] rounded-full bg-[#f3f3f3] px-[10px] py-[3px] text-[12px] font-bold uppercase tracking-[0.5px]">
                <span aria-hidden>★</span>Recommended first
              </span>
              <h3 className={CARD_TITLE}>Faces/Houses</h3>
              <p className={BODY}>
                Does your brain react to faces differently than to houses?
                Takes about 15 minutes.
              </p>
              <div className="mt-[6px] flex flex-wrap items-center gap-[16px]">
                <Button
                  size="lg"
                  variant={firstTime ? 'default' : 'outline-brand'}
                  onClick={() => onStartTemplate(EXPERIMENTS.N170)}
                >
                  Start Faces/Houses
                </Button>
                <Button variant="link" onClick={onBrowseTemplates}>
                  Browse all experiments →
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section
          aria-labelledby={ids.live}
          className="flex flex-col gap-[12px]"
        >
          <h2 id={ids.live} className={SECTION_LABEL}>
            Explore live EEG
          </h2>
          <div className={`${CARD} flex items-center gap-[28px]`}>
            <img
              src={eegArt}
              alt=""
              className="h-[168px] w-[168px] flex-none object-contain"
            />
            <div className="flex min-w-0 flex-col items-start gap-[16px]">
              <h3 className={CARD_TITLE}>Explore EEG</h3>
              <p className={BODY}>
                Put on a headset and watch the EEG (electroencephalogram)
                signal in real time.
              </p>
              <Button variant="outline-brand" onClick={onExploreLive}>
                Open live view
              </Button>
            </div>
          </div>
        </section>
      </div>
      {firstTime && continueSection}
    </div>
  );
}
