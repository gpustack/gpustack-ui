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
    openaiCustomUrl?: string;
    [key: string]: any;
  };
}
export interface MaasProviderItem {
  name: string;
  description: string;
  proxy_url: string;
  proxy_timeout: number;
  config: {
    type: maasProviderType;
    openaiCustomUrl?: string;
    [key: string]: any;
  };
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  timeout: number;
  models: ProviderModel[];
  builtin: boolean;
  provider_model_count: number;
  api_token_count: number;
  api_tokens: { hash: string }[];
}
