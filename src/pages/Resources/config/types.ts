export interface Capacity {
  cpu: number;
  gpu: number;
  memory: string;
  gram: string;
}

export interface NodeItem {
  id: number;
  name: string;
  address: string;
  hostname: string;
  labels: object;
  resources: {
    capacity: Capacity;
    allocable: Capacity;
  };
  state: string;
}
