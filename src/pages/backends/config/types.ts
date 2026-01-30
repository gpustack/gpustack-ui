export interface VersionConfigs {
  image_name: string;
  run_command: string;
  is_default: boolean;
  built_in_frameworks?: string[];
  custom_framework?: string;
  entrypoint?: string;
  version_no?: string;
  is_built_in?: boolean;
  backend_source?: string;
  env: Record<string, any>;
}

export interface VersionListItem extends VersionConfigs {
  availableFrameworks: string[];
}

export interface FormData {
  backend_name: string;
  description?: string;
  version_configs?: VersionConfigs[];
  default_run_command?: string;
  health_check_path?: string;
  default_version?: string;
  default_backend_param?: string[];
  allowed_proxy_uris?: string[];
  content?: string;
  enabled?: boolean;
  backend_source?: string;
  default_env?: Record<string, any>;
}

export interface ListItem extends FormData {
  id: number;
  is_built_in?: boolean;
  created_at?: string;
  updated_at?: string;
  backend_source: string;
  icon: string;
  recommend_models: string[];
  built_in_version_configs?: Record<string, VersionConfigs>;
  framework_index_map?: Record<string, string[]>;
}
