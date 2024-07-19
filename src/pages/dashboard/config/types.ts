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
      memory: number;
      gpu: number;
      gpu_memory: number;
    };
    history: {
      cpu: {
        timestamp: number;
        value: number;
      }[];
      memory: {
        timestamp: number;
        value: number;
      }[];
      gpu: {
        timestamp: number;
        value: number;
      }[];
      gpu_memory: {
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
