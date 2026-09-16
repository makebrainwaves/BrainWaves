import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Foundations/Overview',
};
export default meta;

function Swatch({
  hex,
  name,
  role,
}: {
  hex: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-md border border-gray-200"
        style={{ background: hex }}
      />
      <div>
        <div className="text-sm font-medium text-ink">
          {name} <span className="font-normal text-ink-muted">{hex}</span>
        </div>
        <div className="text-xs text-ink-muted">{role}</div>
      </div>
    </div>
  );
}

export const Colors: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8 max-w-xl">
      <section className="space-y-3">
        <h2 className="!text-lg">Brand — teal is action, gold is location</h2>
        <Swatch
          hex="#007c70"
          name="brand"
          role="Primary actions, links, slider handles"
        />
        <Swatch hex="#00635a" name="brand-dark" role="Primary hover" />
        <Swatch hex="#e6f2f1" name="brand-light" role="Teal tint background" />
        <Swatch
          hex="#ffc107"
          name="accent"
          role="Active nav underline, stepper bubble, illustration gold"
        />
        <Swatch hex="#ffe69c" name="accent-light" role="Nav hover underline" />
      </section>
      <section className="space-y-3">
        <h2 className="!text-lg">
          Signal quality — fixed scale, never reused elsewhere
        </h2>
        <Swatch hex="#66b0a9" name="signal-great" role="Strong signal" />
        <Swatch hex="#ffcd39" name="signal-ok" role="Mediocre signal" />
        <Swatch hex="#e06766" name="signal-bad" role="Weak signal" />
        <Swatch hex="#bfbfbf" name="signal-none" role="No signal" />
      </section>
      <section className="space-y-3">
        <h2 className="!text-lg">Ink</h2>
        <Swatch hex="#1a1a1a" name="ink" role="Primary text" />
        <Swatch
          hex="#666666"
          name="ink-muted"
          role="Muted text, visited states"
        />
        <Swatch
          hex="#cccccc"
          name="ink-faint"
          role="Disabled, rails, initial states"
        />
      </section>
      <section className="space-y-3">
        <h2 className="!text-lg">Background</h2>
        <div className="h-24 rounded-md border border-gray-200 bg-app flex items-center justify-center text-sm text-ink-muted">
          bg-app — white → faint lavender, behind every screen
        </div>
      </section>
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div className="p-8 space-y-6 max-w-2xl bg-white rounded-lg">
      <h1>Large headings are light, never bold</h1>
      <div className="text-xs text-ink-muted">
        h1 — 36/44, weight normal, +1.29px tracking
      </div>
      <h2>Section heading, also light</h2>
      <div className="text-xs text-ink-muted">
        h2 — 36px light (300), −0.025em. Avoid h2s where possible; when used,
        keep them light — never large-and-bold. Components mostly use
        text-lg/text-2xl.
      </div>
      <p>
        Body copy is 18px Lato with open letter-spacing, written for students —
        friendly and unhurried.
      </p>
      <div className="text-xs text-ink-muted">p — 18px, +0.64px tracking</div>
      <div className="text-sm font-bold tracking-[0.5px] text-ink">
        NAV AND TAB LABELS
      </div>
      <div className="text-xs text-ink-muted">
        14px bold uppercase, 0.5px tracking
      </div>
      <div className="text-sm font-medium text-ink">Button label</div>
      <div className="text-xs text-ink-muted">14px medium</div>
    </div>
  ),
};

export const EmptyState: StoryObj = {
  name: 'Empty state pattern',
  render: () => (
    <div className="p-8 grid grid-cols-3 gap-8 max-w-4xl">
      {[
        ['Research Question', 'Enter your research question here.'],
        ['Hypothesis', 'Enter your hypothesis here.'],
        ['Methods', 'Explain your experiment methods here.'],
      ].map(([title, prompt]) => (
        <div key={title}>
          <div className="h-40 bg-gray-100 rounded mb-6" />
          <h1 className="!text-3xl">{title}</h1>
          <p className="text-ink-muted mt-3">{prompt}</p>
        </div>
      ))}
    </div>
  ),
};
