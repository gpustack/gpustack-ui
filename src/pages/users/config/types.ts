export interface FormData {
  username: string;
  id?: number;
  is_admin: boolean | string;
  full_name: string;
  password: string;
  is_active?: boolean;
}

export interface ListItem extends FormData {
  id: number;
  source: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}
