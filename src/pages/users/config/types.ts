export interface ListItem {
  name: string;
  is_admin: boolean;
  full_name: string;
  id: number;
  source: string;
  avatar_url: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface FormData {
  username: string;
  id?: number;
  is_admin: boolean | string;
  full_name: string;
  password: string;
}
