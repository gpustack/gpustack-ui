export interface FormData {
  name: string;
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  spec: {
    data: string;
  };
}

export interface ListItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner_principal_id?: number | null;
  creator_id?: number | null;
  name?: string;
  displayName?: string | null;
  description?: string | null;
  spec: {
    data: string;
  };
}
