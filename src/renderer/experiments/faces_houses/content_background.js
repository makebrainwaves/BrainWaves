import brad from '../../assets/common/brad.png';
import ffa from './ffa.png';

export const background = {
  title: `Why faces are special`,
  idea: `A face tells you who someone is and how they feel, in a fraction of a second. Yet faces are hard to tell apart: almost every face has two eyes above a nose above a mouth.

So researchers have asked whether the brain handles faces in its own way, compared with other objects.`,
  findings: {
    text: `Brain scans (fMRI) found a patch on the underside of the brain, the fusiform face area, that responds more to faces than to other objects, houses included (Kanwisher and colleagues, 1997).

EEG can't see that deep or show where a signal starts, but it is precise about when. Faces typically produce a bigger negative dip about 170 ms after the picture appears, called the N170. It is strongest on the sides of the head, near the ears (Bentin and colleagues, 1996). The Muse's TP9 and TP10 sensors sit there.`,
    image: ffa,
    imageAlt: `The fusiform face area, highlighted in red on the underside of the brain, where brain scans found it`,
  },
  discuss: `Houses differ from faces in more than being a face: shape, color, how much detail they have. If faces give a bigger dip, what else could explain it, and which pictures would you add to find out?`,
  aside: {
    text: `Brad Pitt has said he finds faces hard to recognize. He has never been tested, so nobody knows whether he has face blindness (prosopagnosia): a self-report is not a diagnosis.`,
    image: brad,
  },
  video: {
    caption: 'Oliver Sacks and face blindness',
    embedUrl: 'https://www.youtube-nocookie.com/embed/k5bvnXYIQG8',
  },
  links: [
    {
      name: 'Kanwisher, McDermott & Chun (1997), Journal of Neuroscience: the fusiform face area',
      address: 'https://doi.org/10.1523/JNEUROSCI.17-11-04302.1997',
    },
    {
      name: 'Bentin and colleagues (1996), Journal of Cognitive Neuroscience: the N170',
      address: 'https://doi.org/10.1162/jocn.1996.8.6.551',
    },
  ],
};
