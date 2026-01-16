import { maasProviderType } from '.';

export interface MaasProviderItem {
  id: number;
  name: string;
  state: string;
  state_message: string;
  provider: maasProviderType;
}

export interface FormData {
  name: string;
}
