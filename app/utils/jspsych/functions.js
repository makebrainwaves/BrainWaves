// Converts a normalized timeline template into a classic jsPsych timeline array
export const parseTimeline = timelineTree => {
  const timeline = Object.values(timelineTree).filter(trial =>
    timelineTree.mainTimeline.includes(trial.id)
  );
  console.log(timeline);
  return timeline;
};
