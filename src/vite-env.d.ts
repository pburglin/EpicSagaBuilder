/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_MODEL_NAME: string;
  readonly VITE_LLM_MAX_TOKENS: string;
  readonly VITE_LLM_SUMMARY_TOKENS: string;
  readonly VITE_LLM_STORY_TEMPERATURE: string;
  readonly VITE_LLM_API_ENDPOINT: string;
  readonly VITE_LLM_API_KEY: string;
  readonly VITE_IMAGE_PROMPT_MAX_CHARS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
