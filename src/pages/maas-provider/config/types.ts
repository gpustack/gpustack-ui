import { maasProviderType } from '.';

export interface FormData {
  name: string;
  description: string;
  api_tokens: string[];
  config: {
    type: maasProviderType;
    [key: string]: any;
  };
}
export interface MaasProviderItem extends FormData {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  timeout: number;
  support_models: unknown[];
  proxy_url: string;
  proxy_timeout: number;
  builtin: boolean;
  provider_model_count: number;
  api_token_count: number;
}
