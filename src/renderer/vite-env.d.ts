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

declare module '*.py' {
  const content: string;
  export default content;
}
