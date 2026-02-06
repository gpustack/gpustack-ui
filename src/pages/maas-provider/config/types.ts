import { maasProviderType } from '.';
export interface ProviderModel {
  name: string;
  category: string;
  accessible: boolean | null;
}
export interface FormData {
  name: string;
  description: string;
  api_tokens: string[];
  models: ProviderModel[];
  api_key: string;
  config: {
    type: maasProviderType;
    openaiCustomUrl?: string;
    [key: string]: any;
  };
}
export interface MaasProviderItem extends FormData {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  timeout: number;
  models: ProviderModel[];
  proxy_url: string;
  proxy_timeout: number;
  builtin: boolean;
  provider_model_count: number;
  api_token_count: number;
}
