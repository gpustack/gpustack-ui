import { maasProviderType } from '.';
export interface ProviderModel {
  name: string;
  category?: string;
  accessible: boolean | null;
}
export interface FormData {
  name: string;
  description: string;
  api_tokens: string[];
  models: ProviderModel[];
  api_key: string;
  proxy_url: string;
  proxy_timeout: number;
  proxy_enabled?: boolean;
  config: {
    type: maasProviderType;
    openaiCustomUrl?: string | null;
    claudeCustomUrl?: string | null;
    [key: string]: any;
  };
}
export interface MaasProviderItem {
  name: string;
  description?: string | null;
  owner_principal_id?: number | null;
  proxy_url?: string | null;
  proxy_timeout?: number | null;
  // A provider created without an API key is legitimate (self-hosted,
  // tokenless endpoints) — list/get responses then carry api_tokens: [].
  // Malformed records must not be able to take down whole pages, so these
  // fields are tolerated as null/undefined everywhere they are read.
  config?: {
    type: maasProviderType;
    openaiCustomUrl?: string | null;
    claudeCustomUrl?: string | null;
    [key: string]: any;
  } | null;
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  timeout: number;
  models?: ProviderModel[] | null;
  builtin?: boolean | null;
  provider_model_count?: number | null;
  api_token_count?: number | null;
  api_tokens?: { hash: string }[] | null;
}

export interface RequiredFields {
  type: 'Input' | 'Select' | 'Password';
  name: string;
  label: {
    text: string;
    locale?: boolean;
  };
  required?: boolean;
  placeholder?: string;
  // tooltip on the label
  description?: {
    text: string;
    locale?: boolean;
  };
  // hint line rendered below the field
  hint?: {
    text: string;
    locale?: boolean;
  };
  rules?: any[];
}
