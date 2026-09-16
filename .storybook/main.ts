import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/renderer/**/*.stories.tsx'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        // Root vite.config.ts is an electron-vite config (main/preload/renderer
        // sections) — not loadable as a plain Vite config.
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
};

export default config;
