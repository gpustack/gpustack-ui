export interface VersionConfigs {
  [key: string]: {
    image_name: string;
    run_command: string;
  };
}

export interface FormData {
  backend_name: string;
  description?: string;
  version_configs?: VersionConfigs;
  compatibility_type?: string;
  health_check_path?: string;
  default_version?: string;
  default_backend_param?: string[];
  allowed_proxy_uris?: string[];
}

export interface ListItem extends FormData {
  id: number;
  created_at: string;
  updated_at: string;
}
