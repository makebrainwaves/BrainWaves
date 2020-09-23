import { params } from './params';
import { background } from './content_background';
import { protocol } from './content_protocol';
import overview from './overview.md';

console.log(overview);

const buildTimeline = () => ({
  params,
  background,
  overview,
  protocol,
});

export default buildTimeline;
