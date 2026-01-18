import { maasProviderType } from '.';

export interface MaasProviderItem {
  id: number;
  name: string;
  models?: number;
  state: string;
  state_message: string;
  provider: maasProviderType;
  builtIn: boolean;
}

export interface FormData {
  name: string;
}
