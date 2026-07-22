import {
  InstanceTypeDetail,
  InstanceTypeResource
} from '../../instances/config/types';

export interface UnitResources {
  cpu?: string | null;
  ram?: string | null;
}

// spec carries user-defined fields only; observed hardware (manufacturer,
// memory, sliced capability, …) lives on status.detail.
export interface InstanceTypeSpec {
  displayName?: string | null;
  os?: string | null;
  arch?: string | null;
  acceleratable?: boolean;
  acceleratorGroup?: string | null;
  generalGroup?: string | null;
  unitResources?: UnitResources | null;
  localStorage?: string | null;
}

export interface InstanceTypeStatus {
  // Observed hardware descriptor; absent until the operator backfills status.
  detail?: InstanceTypeDetail | null;
  phase?: string | null;
  phaseMessage?: string | null;
  // Per-mode resource accounting ({onceMaxRequest, remaining, capacity}).
  accelerator?: InstanceTypeResource | null;
  acceleratorShared?: InstanceTypeResource | null;
  acceleratorSliced?: InstanceTypeResource | null;
  cpu?: InstanceTypeResource | null;
}

// Row shape for the management list (GET /gpu-instance-types).
export interface ListItem {
  name: string;
  spec: InstanceTypeSpec;
  status?: InstanceTypeStatus;
}

// Selectable flavor shown in the create drawer's first column
// (GET /gpu-instance-type-flavors). Its acceleratorGroup / generalGroup /
// acceleratable are copied into the created instance type.
export interface FlavorItem {
  name: string;
  spec: {
    manufacturer?: string | null;
    product?: string | null;
    family?: string | null;
    memory?: string | null;
    cores?: string | null;
    acceleratable?: boolean;
    acceleratorGroup?: string | null;
    generalGroup?: string | null;
  };
}

// Body for POST /gpu-instance-types (GPUInstanceTypeCreate).
export interface FormData {
  name: string;
  spec: {
    displayName?: string | null;
    acceleratorGroup?: string | null;
    generalGroup?: string | null;
    acceleratable?: boolean;
    os: string;
    arch?: string | null;
    unitResources?: UnitResources;
    localStorage?: string | null;
  };
}
