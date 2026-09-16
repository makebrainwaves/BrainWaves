import { SIGNAL_QUALITY } from './constants';

export interface ElectrodeMetadata {
  location: string;
  description: string;
  fixes: Record<SIGNAL_QUALITY, string>;
}

export const QUALITY_LABELS: Record<SIGNAL_QUALITY, string> = {
  [SIGNAL_QUALITY.GREAT]: 'good',
  [SIGNAL_QUALITY.OK]: 'settling',
  [SIGNAL_QUALITY.BAD]: 'noisy',
  [SIGNAL_QUALITY.DISCONNECTED]: 'no signal',
};

const contactFixes: Record<SIGNAL_QUALITY, string> = {
  [SIGNAL_QUALITY.GREAT]: 'Good: stay relaxed and keep the headset still.',
  [SIGNAL_QUALITY.OK]: 'Settling: press gently and hold for 10 seconds.',
  [SIGNAL_QUALITY.BAD]:
    'Noisy: adjust this sensor so it rests directly on skin.',
  [SIGNAL_QUALITY.DISCONNECTED]:
    'No signal: check that this sensor is touching your skin.',
};

const hairFixes: Record<SIGNAL_QUALITY, string> = {
  ...contactFixes,
  [SIGNAL_QUALITY.BAD]:
    'Noisy: move hair aside so this sensor touches your scalp.',
};

export const UNKNOWN_ELECTRODE: ElectrodeMetadata = {
  location: 'Headset sensor',
  description:
    'This channel is supplied by your headset. Its scalp position is not in our sensor map; check the headset guide for placement.',
  fixes: contactFixes,
};

/** Scalp locations describe nearby anatomy, not a localized measurement of thoughts. */
export const ELECTRODES: Record<string, ElectrodeMetadata> = {
  TP9: {
    location: 'Behind the left ear',
    description:
      'Sits behind the left ear, near the temporal lobe, which helps process sound and memory. Jaw and neck muscles can also appear in this signal.',
    fixes: contactFixes,
  },
  AF7: {
    location: 'Left forehead',
    description:
      'Sits over the left frontal lobe, above the eyebrow. Picks up activity from regions involved in attention and decision making, plus blinks and eyebrow raises.',
    fixes: contactFixes,
  },
  AF8: {
    location: 'Right forehead',
    description:
      'Sits over the right frontal lobe, above the eyebrow. Picks up activity from regions involved in attention and decision making, plus blinks and eyebrow raises.',
    fixes: contactFixes,
  },
  TP10: {
    location: 'Behind the right ear',
    description:
      'Sits behind the right ear, near the temporal lobe, which helps process sound and memory. Jaw and neck muscles can also appear in this signal.',
    fixes: contactFixes,
  },
  Fpz: {
    location: 'Middle forehead',
    description:
      'Sits at the front midline, near frontal regions involved in planning and attention. It is also close to the eyes and sensitive to blinks.',
    fixes: contactFixes,
  },
  AF3: {
    location: 'Left front scalp',
    description:
      'Sits between the left forehead and frontal scalp, near regions involved in attention and planning. Eye movements can affect this signal.',
    fixes: hairFixes,
  },
  AF4: {
    location: 'Right front scalp',
    description:
      'Sits between the right forehead and frontal scalp, near regions involved in attention and planning. Eye movements can affect this signal.',
    fixes: hairFixes,
  },
  F3: {
    location: 'Left frontal scalp',
    description:
      'Sits over the left frontal region, involved in planning and attention. Scalp EEG mixes nearby and more distant electrical activity.',
    fixes: hairFixes,
  },
  F4: {
    location: 'Right frontal scalp',
    description:
      'Sits over the right frontal region, involved in planning and attention. Scalp EEG mixes nearby and more distant electrical activity.',
    fixes: hairFixes,
  },
  FC5: {
    location: 'Left front-side scalp',
    description:
      'Sits between frontal and central regions on the left, near areas involved in movement. Nearby muscles can also affect the signal.',
    fixes: hairFixes,
  },
  FC6: {
    location: 'Right front-side scalp',
    description:
      'Sits between frontal and central regions on the right, near areas involved in movement. Nearby muscles can also affect the signal.',
    fixes: hairFixes,
  },
  T7: {
    location: 'Left temple',
    description:
      'Sits above the left ear near the temporal region, involved in hearing and memory. Jaw muscle activity can be prominent here.',
    fixes: hairFixes,
  },
  T8: {
    location: 'Right temple',
    description:
      'Sits above the right ear near the temporal region, involved in hearing and memory. Jaw muscle activity can be prominent here.',
    fixes: hairFixes,
  },
  M1: {
    location: 'Left mastoid',
    description:
      'Sits on the bony area behind the left ear. This position is often used as a reference; its role depends on your headset.',
    fixes: contactFixes,
  },
  M2: {
    location: 'Right mastoid',
    description:
      'Sits on the bony area behind the right ear. This position is often used as a reference; its role depends on your headset.',
    fixes: contactFixes,
  },
  P7: {
    location: 'Left rear-side scalp',
    description:
      'Sits near the left parietal and temporal regions, which help integrate sensory information. Hair can interfere with sensor contact.',
    fixes: hairFixes,
  },
  P8: {
    location: 'Right rear-side scalp',
    description:
      'Sits near the right parietal and temporal regions, which help integrate sensory information. Hair can interfere with sensor contact.',
    fixes: hairFixes,
  },
  O1: {
    location: 'Left back of head',
    description:
      'Sits near the left occipital region, involved in vision. Rhythms here can change when eyes close, though not in every recording.',
    fixes: hairFixes,
  },
  O2: {
    location: 'Right back of head',
    description:
      'Sits near the right occipital region, involved in vision. Rhythms here can change when eyes close, though not in every recording.',
    fixes: hairFixes,
  },
};
