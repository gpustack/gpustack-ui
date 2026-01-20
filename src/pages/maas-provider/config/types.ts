import { maasProviderType } from '.';

export interface MaasProviderItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  description: string;
  api_tokens: string[];
  timeout: number;
  config: {
    type: maasProviderType;
    [key: string]: any;
  };
  support_models: unknown[];
  proxy_url: string;
  proxy_timeout: number;
  builtin: boolean;
  provider_model_count: number;
  api_token_count: number;
}

export interface FormData {
  name: string;
  description: string;
  api_tokens: string[];
  config: {
    type: maasProviderType;
    [key: string]: any;
  };
}
