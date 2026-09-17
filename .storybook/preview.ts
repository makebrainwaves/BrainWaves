import type { Preview } from '@storybook/react-vite';
import '../src/renderer/app.global.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        app: {
          name: 'App gradient',
          value: 'linear-gradient(to bottom, #f9f9f9, #f0f0ff)',
        },
        white: { name: 'White', value: '#ffffff' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'app' },
  },
};

export default preview;
