interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TOKEN: string;
  readonly VITE_API_BACKEND_AUTH_NODE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
