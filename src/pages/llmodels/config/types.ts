export interface ListItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_file_name: string;
  s3Address: string;
  name: string;
  description: string;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FormData {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  ollama_library_model_name: 'string';
  name: string;
  replicas: number;
  description: string;
}

export interface ModelInstanceListItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  node_id: number;
  node_ip: string;
  pid: number;
  port: number;
  state: string;
  download_progress: number;
  model_id: number;
  model_name: string;
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ModelInstanceFormData {
  model_id: number;
  model_name: string;
  source: string;
  huggingface_repo_id: 'string';
  huggingface_filename: 'string';
}
