import { atom } from 'jotai';

export interface SystemConfig {
  disable_builtin_observability: boolean;
  debug: boolean;
  grafana_url: string;
  server_external_url: string | null;
  system_default_container_registry: string | null;
  showMonitoring?: boolean;
}

export const systemConfigAtom = atom<SystemConfig>({} as SystemConfig);
