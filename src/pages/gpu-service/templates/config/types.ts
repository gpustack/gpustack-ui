export interface PortItem {
  protocol: 'UDP' | 'TCP';
  port: number;
  name?: string;
}

export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

export interface EnvItem {
  name: string;
  value: string;
}

export interface FormData {
  name: string;
  description: string;
  displayName?: string;
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
  // NULL = a shared, admin-managed preset visible to everyone; a
  // non-NULL id scopes the template to a single owner. Surfaced via
  // the `OwnerScopeTag` slot on the card so the owner is visible at a
  // glance. Optional on the wire — absent in single-owner builds.
  owner_principal_id?: number | null;
  creator_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
