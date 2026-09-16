export type LessonId = 'clean-signal' | 'noise-sources';

/** Shared with Collect's existing help; the noise lesson there remains unchanged. */
export const CLEAN_SIGNAL_LESSON = [
  {
    title: 'Improve the signal quality',
    body: 'In order to collect quality data, you want to make sure that all electrodes have  a strong connection',
  },
  {
    title: 'Tip #1: Good skin contact (and give it a minute)',
    body: "The sensors read best against clean, bare skin — sweep hair out from under them and wipe away any makeup or lotion. When you first put the headset on the signal often looks red and jumpy: that's normal while the sensors settle into contact. Sit still and it should calm down and turn green within a minute.",
  },
  {
    title: 'Tip #2: Ensure the sensors are making firm contact',
    body: 'Re-seat the headset to make sure that all sensors contact the head with some tension. Take extra care to make sure the reference electrodes (the ones right behind the ears) make proper contact.  You may need to sweep hair out of the way to accomplish this',
  },
  {
    title: 'Tip #3: Stay still',
    body: 'To reduce noise during your experiment, ensure your subject is relaxed and has both feet on the floor. Sometimes, focusing on relaxing the jaw and the tongue can improve the EEG signal',
  },
] as const;

export const EXPLORE_LESSONS = [
  {
    id: 'clean-signal',
    title: 'How do I get a cleaner signal?',
    detail: '3 tips · about 1 minute',
  },
  {
    id: 'noise-sources',
    title: 'Where is this noise coming from?',
    detail: '4 steps · about 2 minutes',
  },
] as const;
