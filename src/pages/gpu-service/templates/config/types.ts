export interface PortItem {
  protocol: 'UDP' | 'TCP';
  port: number;
}

export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

export interface EnvItem {
  name: string;
  value: string;
}

export interface FormData {
  name: string;
  description: string;
  manufacturer: string;
  spec: {
    image: string;
    imagePullPolicy: ImagePullPolicy;
    command: string[];
    ports: PortItem[];
    env: EnvItem[];
    volumeMount: string;
    resources: {
      cpu: string;
      ram: string;
      localStorage: string;
      accelerator: string;
    };
  };
}

export interface ListItem extends FormData {
  id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
