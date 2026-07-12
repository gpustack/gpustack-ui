export interface UnitResources {
  cpu?: string | null;
  ram?: string | null;
}

export interface InstanceTypeSpec {
  manufacturer?: string | null;
  product?: string | null;
  family?: string | null;
  memory?: string | null;
  cores?: string | null;
  clockSpeed?: string | null;
  sliceable?: boolean;
  os?: string | null;
  arch?: string | null;
  acceleratable?: boolean;
  acceleratorGroup?: string | null;
  generalGroup?: string | null;
  unitResources?: UnitResources | null;
  localStorage?: string | null;
}

export interface InstanceTypeStatus {
  phase?: string | null;
  phaseMessage?: string | null;
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
    sliceable?: boolean;
    acceleratable?: boolean;
    acceleratorGroup?: string | null;
    generalGroup?: string | null;
  };
}

// Body for POST /gpu-instance-types (GPUInstanceTypeCreate).
export interface FormData {
  name: string;
  spec: {
    acceleratorGroup?: string | null;
    generalGroup?: string | null;
    acceleratable?: boolean;
    os: string;
    arch?: string | null;
    unitResources?: UnitResources;
    localStorage?: string | null;
  };
}
