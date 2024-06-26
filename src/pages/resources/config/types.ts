export interface Gpu {
  uuid: string;
  name: string;
  vendor: string;
  index: number;
  core: {
    total: number;
    allocated: number;
    utilization_rate: number;
  };
  memory: {
    total: number;
    allocated: number;
    used: number;
    utilization_rate: number;
  };
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
  state: string;
  ip: string;
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
  };
  id: number;
  created_at: string;
  updated_at: string;
}
