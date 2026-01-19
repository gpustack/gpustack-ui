export interface AccessItem {
  id: number;
  name: string;
  source: string;
  accessPoints?: number;
}

export interface FormData {
  name: string;
  description: string;
  categories: any[];
  meta: Record<string, any>;
  endpoints: {
    provider_model_name: string;
    weight: number;
    model_id: number;
    provider_id: number;
  }[];
}
