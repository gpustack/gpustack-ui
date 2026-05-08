export interface FormData extends Global.K8sCommonData {
  data: string;
}

export interface ListItem extends FormData {
  id: number;
  created_at?: string;
  updated_at?: string;
}
