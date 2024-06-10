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
  name: string;
  description: string;
}
