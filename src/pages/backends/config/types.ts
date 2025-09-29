export interface VersionConfigs {
  image_name: string;
  run_command: string;
  is_default: boolean;
  backend_list?: string[];
  version_no?: string;
  is_built_in?: boolean;
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
}

export interface ListItem extends FormData {
  id: number;
  is_build_in?: boolean;
  created_at?: string;
  updated_at?: string;
  build_in_version_configs?: Record<string, VersionConfigs>;
}
