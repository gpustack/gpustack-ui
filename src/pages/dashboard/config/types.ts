export interface DashboardProps {
  resource_counts: {
    worker_count: number;
    gpu_count: number;
    model_count: number;
    model_instance_count: number;
  };
  system_load: {
    current: {
      cpu: number;
      ram: number;
      gpu: number;
      vram: number;
    };
    history: {
      cpu: {
        timestamp: number;
        value: number;
      }[];
      ram: {
        timestamp: number;
        value: number;
      }[];
      gpu: {
        timestamp: number;
        value: number;
      }[];
      vram: {
        timestamp: number;
        value: number;
      }[];
    };
  };
  model_usage: {
    api_request_history: any[];
    completion_token_history: any[];
    prompt_token_history: any[];
    top_users: {
      user_id: number;
      username: string;
      prompt_token_count: number;
      completion_token_count: number;
    }[];
  };
  active_models: any[];
}

export interface DashboardUsageData {
  api_request_history: any[];
  completion_token_history: any[];
  prompt_token_history: any[];
}

export interface TableRow {
  id: number;
  prompt_token_count: number;
  completion_token_count: number;
  operation: string;
  model_id: number;
  date: string;
  user_id: number;
  request_count: number;
}
