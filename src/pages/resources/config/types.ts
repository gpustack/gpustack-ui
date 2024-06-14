export interface Gpu {
  uuid: string;
  name: string;
  vendor: string;
  index: number;
  core_total: number;
  core_allocated: number;
  core_utilization_rate: number;
  memory_total: number;
  memory_allocated: number;
  memory_used: number;
  temperature: number;
}

export interface Filesystem {
  name: string;
  mount_point: string;
  mount_from: string;
  total: number;
  used: number;
  free: number;
  available: number;
}

export interface Kernel {
  name: string;
  release: string;
  version: string;
  architecture: string;
}

export interface ListItem {
  name: string;
  hostname: string;
  address: string;
  labels: object;
  status: {
    cpu: {
      total: number;
      allocated: number;
      utilization_rate: number;
    };
    memory: {
      total: number;
      used: number;
      allocated: number;
    };
    gpu: Gpu[];
    swap: {
      total: number;
      used: number;
    };
    filesystem: Filesystem[];
    os: {
      name: string;
      version: string;
    };
    kernel: Kernel;
    uptime: {
      uptime: number;
      boot_time: string;
    };
    state: string;
  };
  id: number;
  created_at: string;
  updated_at: string;
}
