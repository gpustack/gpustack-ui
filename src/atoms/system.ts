import { atom } from 'jotai';

export interface SystemConfig {
  grafana_url: string;
  disable_builtin_observability: boolean;
  debug: boolean;
  grafana_model_dashboard_uid: string;
  grafana_worker_dashboard_uid: string;
  system_default_container_registry: string | null;
  server_external_url: string | null;
  showMonitoring?: boolean;
}

export const systemConfigAtom = atom<SystemConfig>({} as SystemConfig);
