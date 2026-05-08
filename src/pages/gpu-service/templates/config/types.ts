export interface PortItem {
  protocol: 'udp' | 'tcp';
  port: number;
}

export interface EnvItem {
  name: string;
  value: string;
}

export interface FormData {
  image: string;
  imagePullPolicy: string;
  imagePullSecret: {
    name: string;
  };
  command: string[];
  privileged: boolean;
  ports: PortItem[];
  env: EnvItem[];
  volumeMount: string;
  resources: {
    cpu: string;
    ram: string;
  };
}

export interface ListItem extends FormData {
  id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
