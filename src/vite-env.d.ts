/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_DEV_CONVEX_URL?: string;
  readonly VITE_PROD_CONVEX_URL?: string;
  readonly VITE_PROD_SITE_URL?: string;
  readonly VITE_HAS_PRODUCTION_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

