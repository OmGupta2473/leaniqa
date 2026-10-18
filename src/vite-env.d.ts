/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RESOLVE_V2_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}