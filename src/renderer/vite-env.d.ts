/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOG_LEVEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.py?raw' {
  const content: string;
  export default content;
}

declare module '*.csv?raw' {
  const content: string;
  export default content;
}

declare module '*.py' {
  const content: string;
  export default content;
}

/** Plotly's cartesian-only bundle (no map traces) shares the full plotly.js API. */
declare module 'plotly.js-cartesian-dist' {
  import * as Plotly from 'plotly.js';
  export default Plotly;
}
