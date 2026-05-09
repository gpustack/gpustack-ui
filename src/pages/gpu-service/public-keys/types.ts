export interface FormData {
  name: string;
  description: string;
  spec: {
    data: string;
  };
}

export interface ListItem extends FormData {
  id: number;
  created_at?: string;
  updated_at?: string;
}
