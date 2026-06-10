export interface ListItem {
  name: string;
  description: string;
  id: number;
  value: string;
  masked_value?: string;
  user_id?: number;
  user_name?: string;
  // The owning principal — an Org, or a USER principal when the key
  // was created in someone's Personal Org. Read by the enterprise
  // plugin's Organization column in the admin All-org view.
  owner_principal_id?: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
  allowed_model_names: string[];
  custom?: string;
  scope?: string[];
  is_custom?: boolean;
}

export interface FormData {
  name: string;
  allowed_type: 'all' | 'custom' | 'management';
  key_type: 'auto' | 'custom';
  description: string;
  allowed_model_names: string[];
  expires_in: number | null;
  custom?: string;
  scope?: string[];
}
