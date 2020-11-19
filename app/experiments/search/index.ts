import { params } from './params';
import { background } from './content_background';
import { overview } from './content_overview';
import { protocol } from './content_protocol';

const buildTimeline = () => ({
  params,
  background,
  overview,
  protocol,
});

export default buildTimeline;
