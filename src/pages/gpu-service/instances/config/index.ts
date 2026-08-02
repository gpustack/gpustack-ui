import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { IconFont, icons } from '@gpustack/core-ui';
import _ from 'lodash';
import React from 'react';
import { parseQuantityToGi } from '../../utils';
import {
  AcceleratorProfileCount,
  AcceleratorSlicedDetail,
  AcceleratorSlicedPhysicalDetailProfile,
  InstanceTypeOverviewResource,
  InstanceTypePartitionedResource,
  ListItem
} from '../config/types';

// Soft (logical) slicing — a card is split by percentage. Supported when the
// logical slice count is positive.
export const isLogicalSliceable = (detail?: AcceleratorSlicedDetail | null) =>
  (detail?.logical?.count ?? 0) > 0;

// Hard (physical) slicing — a card is partitioned into fixed-shape profiles
// (e.g. MIG). Supported when the physical slice count is positive.
export const isPhysicalSliceable = (detail?: AcceleratorSlicedDetail | null) =>
  (detail?.physical?.count ?? 0) > 0;

// Whether a type can be sliced at all, per the API contract (replaces the
// removed `spec.sliceable` boolean). Every level of slicedDetail may be absent
// (exclude_none responses).
export const isSliceableDetail = (detail?: AcceleratorSlicedDetail | null) =>
  isLogicalSliceable(detail) || isPhysicalSliceable(detail);

// Hard-slice profiles this pool OFFERS, per the static capability catalog. The
// counts are the catalog's ceiling, and by design they do not move as partitions
// are carved and released — so this cannot answer "which profiles can I still
// get". That is the ledger's job (obtainablePartitionProfiles below).
//
// Deliberately NOT exported: its only remaining use is as the version-skew
// fallback inside getSelectablePartitionProfiles*, and every form that used to
// call it was offering profiles the pool could no longer build. Keeping it
// module-private is what stops that from creeping back under an
// availability-sounding name. For "does this pool offer hardware partitioning at
// all", use isPhysicalSliceable.
const getOfferedPartitionProfiles = (
  detail?: AcceleratorSlicedDetail | null
): AcceleratorSlicedPhysicalDetailProfile[] =>
  (detail?.physical?.profiles ?? []).filter(
    (profile) => !!profile?.name && (profile?.count ?? 0) > 0
  );

// Obtainable profile names from a partition ledger, or null for "cannot tell".
//
// null is not []: an empty or all-zero list means the pool offers partitioning
// but has nothing left right now, while null means no ledger was sent at all —
// and the caller must then fall back rather than render an empty dropdown, which
// would turn version skew into a partition-mode regression instead of a graceful
// degrade.
//
// The Array.isArray guard is what makes that safe: a server older than the
// ledger sends this dimension as a scalar quantity string, not as a missing
// field, so `counts` can arrive as "1" despite the type. Treat anything that is
// not a list as "cannot tell".
//
// A missing count is zero, not unknown: the API omits it at zero, so an entry
// naming only a profile is that profile at zero.
export const obtainablePartitionProfiles = (
  counts?: AcceleratorProfileCount[] | null
): string[] | null =>
  Array.isArray(counts)
    ? counts
        .filter((entry) => !!entry?.name && (entry?.count ?? 0) > 0)
        .map((entry) => entry.name as string)
    : null;

// Profile names a form may offer: the live ledger when there is one, else the
// capability catalog. The fallback is deliberately at LIST level, never per
// element — an empty ledger means "offered, nothing left" and must stay empty,
// while a missing ledger means "unknown" and falls back. Collapsing the two
// (e.g. `ledger?.[0] ?? catalog[0]`) silently resurrects unbuildable profiles.
const selectablePartitionProfiles = (
  ledger: AcceleratorProfileCount[] | null | undefined,
  capability: AcceleratorSlicedDetail | null | undefined
): string[] =>
  obtainablePartitionProfiles(ledger) ??
  getOfferedPartitionProfiles(capability).map(
    (profile) => profile.name as string
  );

// Aggregated shape (GET /gpu-instance-types/aggregated): the ledger is the
// list-typed acceleratorPartitioned dimension of an overview resource. Pass
// status.remaining for the fleet inventory.
export const getSelectablePartitionProfilesFromOverview = (
  overview?: InstanceTypeOverviewResource | null,
  capability?: AcceleratorSlicedDetail | null
): string[] =>
  selectablePartitionProfiles(overview?.acceleratorPartitioned, capability);

// Per-cluster shape (GET /gpu-instance-types?cluster_id): the same ledger, but
// nested on the partitioned resource. The two envelopes share the key name
// `acceleratorPartitioned`, so reading the wrong one yields undefined and
// silently falls back to the capability catalog — i.e. the bug these helpers
// exist to remove. Pick the adapter that matches the endpoint.
export const getSelectablePartitionProfilesFromResource = (
  partitioned?: InstanceTypePartitionedResource | null,
  capability?: AcceleratorSlicedDetail | null
): string[] =>
  selectablePartitionProfiles(partitioned?.remainingProfiles, capability);

// A profile name encodes its VRAM after the dot — "1g.10gb" → 10 (GB).
export const parseProfileMemoryGB = (name?: string | null): number | null => {
  const match = /\.(\d+(?:\.\d+)?)gb$/i.exec(String(name ?? ''));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

// Share of the whole card a partition profile takes, as a percentage — the
// profile's VRAM over the card's VRAM (status.detail.memory, e.g. "80Gi").
// CPU / RAM are handed out in that proportion, so the form scales the unit
// resources by it exactly like the soft-slice percentage. Null when either
// side is unknown (then CPU / RAM fall back to the whole-card unit values).
export const getPartitionPercentage = (
  profileName?: string | null,
  cardMemory?: string | null
): number | null => {
  const profileGB = parseProfileMemoryGB(profileName);
  const cardGB = parseQuantityToGi(cardMemory ?? null)?.value;
  if (!profileGB || !cardGB) return null;
  return (profileGB / cardGB) * 100;
};

export const InstanceStatusValueMap = {
  Scheduling: 'Scheduling',
  Pending: 'Pending',
  Scheduled: 'Scheduled',
  Initializing: 'Initializing',
  InitializeFailed: 'InitializeFailed',
  Initialized: 'Initialized',
  Preparing: 'Preparing',
  NotReady: 'NotReady',
  Ready: 'Ready',
  Starting: 'Starting',
  Deleting: 'Deleting',
  Stopping: 'Stopping',
  Stopped: 'Stopped',
  CreateFailed: 'CreateFailed',
  SSHPublicKeyCreateFailed: 'SSHPublicKeyCreateFailed',
  PersistentVolumeTypeCreateFailed: 'PersistentVolumeTypeCreateFailed',
  PersistentVolumeCreateFailed: 'PersistentVolumeCreateFailed',
  Unknown: 'Unknown'
};

export const K8SStatuses = [
  InstanceStatusValueMap.Scheduling,
  InstanceStatusValueMap.Pending,
  InstanceStatusValueMap.Scheduled,
  InstanceStatusValueMap.Initializing,
  InstanceStatusValueMap.InitializeFailed,
  InstanceStatusValueMap.Initialized,
  InstanceStatusValueMap.Preparing,
  InstanceStatusValueMap.NotReady,
  InstanceStatusValueMap.Ready
];

export const GPUStackFailedStatuses = [
  InstanceStatusValueMap.CreateFailed,
  InstanceStatusValueMap.SSHPublicKeyCreateFailed,
  InstanceStatusValueMap.PersistentVolumeTypeCreateFailed,
  InstanceStatusValueMap.PersistentVolumeCreateFailed
];

export const InstanceStatusLabelMap: Record<string, string> = {
  // === K8s Statuses ===
  ...Object.fromEntries(K8SStatuses.map((status) => [status, status])),
  // === GPUStack Statuses no logs and events===
  [InstanceStatusValueMap.Deleting]: 'Deleting',
  [InstanceStatusValueMap.Stopping]: 'Stopping',
  [InstanceStatusValueMap.Stopped]: 'Stopped',
  [InstanceStatusValueMap.Unknown]: 'Unknown',
  [InstanceStatusValueMap.Starting]: 'Starting',
  ...Object.fromEntries(
    GPUStackFailedStatuses.map((status) => [status, status])
  )
};

export const status: Record<string, StatusType> = {
  [InstanceStatusValueMap.Scheduling]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Scheduled]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.InitializeFailed]: StatusMaps.error,
  [InstanceStatusValueMap.Initialized]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Preparing]: StatusMaps.transitioning,
  [InstanceStatusValueMap.NotReady]: StatusMaps.error,
  [InstanceStatusValueMap.Ready]: StatusMaps.success,
  [InstanceStatusValueMap.Starting]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Deleting]: StatusMaps.warning,
  [InstanceStatusValueMap.Stopping]: StatusMaps.transitioning,
  [InstanceStatusValueMap.Stopped]: StatusMaps.inactive,
  [InstanceStatusValueMap.CreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.SSHPublicKeyCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.PersistentVolumeTypeCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.PersistentVolumeCreateFailed]: StatusMaps.error,
  [InstanceStatusValueMap.Unknown]: StatusMaps.error
};

export interface InstanceRowAction {
  label: string;
  key: string;
  locale?: boolean;
  icon?: React.ReactNode;
  props?: Record<string, any>;
  show?: (record: ListItem) => boolean;
  disabled?: (record: ListItem) => boolean;
}

export const rowActionList: InstanceRowAction[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    locale: true,
    icon: React.createElement(IconFont, { type: 'icon-logs' }),
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Ready].includes(phase as string);
    }
  },
  {
    label: 'common.button.viewevent',
    key: 'viewevent',
    locale: true,
    icon: icons.ProfileOutlined,
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [...K8SStatuses, InstanceStatusValueMap.Starting].includes(
        phase as string
      );
    }
  },
  {
    label: 'common.button.start',
    key: 'start',
    locale: true,
    icon: icons.Play,
    props: {
      disabled: false
    },
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Stopped].includes(phase as string);
    }
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    locale: true,
    icon: icons.Stop,
    props: {
      disabled: false
    },
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return [InstanceStatusValueMap.Ready].includes(phase as string);
    }
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    show: (record: ListItem) => {
      const phase = record.status?.phase;
      return true;
    },
    props: {
      danger: true
    }
  }
];

export const batchActionList = [
  {
    label: 'common.button.start',
    key: 'start',
    locale: true,
    icon: icons.Play
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    locale: true,
    icon: icons.Stop
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const InstanceTypePhaseValueMap = {
  PreParing: 'Preparing',
  Inactive: 'Inactive',
  Active: 'Active'
};

export const InstanceTypePhaseLabelMap: Record<string, string> = {
  [InstanceTypePhaseValueMap.PreParing]: 'Preparing',
  [InstanceTypePhaseValueMap.Inactive]: 'Inactive',
  [InstanceTypePhaseValueMap.Active]: 'Active'
};

export const InstanceTypePhaseStatus: Record<string, StatusType> = {
  [InstanceTypePhaseValueMap.PreParing]: StatusMaps.transitioning,
  [InstanceTypePhaseValueMap.Inactive]: StatusMaps.inactive,
  [InstanceTypePhaseValueMap.Active]: StatusMaps.success
};

export const StorageModeValueMap = {
  Temporary: 'temporary',
  Persistent: 'persistent'
};

export const DEFAULT_PV_CAPACITY_GB = 20;

// Constant SSH public key resource name used when SSH is enabled
export const DEFAULT_SSH_PUBLIC_KEY_NAME = 'default';

const GI_DIVISOR: Record<string, number> = {
  Ki: 1024 * 1024,
  Mi: 1024,
  Gi: 1
};

export const convertKiToGi = (value?: string): string | undefined => {
  if (!value) return value;
  const match = /^(-?\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)$/.exec(value);
  if (!match) return value;
  const [, num, unit] = match;
  if (unit === 'Ti') return `${_.floor(Number(num), 0)} Ti`;
  return `${_.floor(Number(num) / GI_DIVISOR[unit], 0)} Gi`;
};

// Memory quantity → display string, flooring to whole Gi. Accepts a k8s
// quantity string ("16Gi" / "32607Mi") or a raw MiB number (as the Usage
// breakdown carries it). Centralizes the conversion so the GPU Instances list
// and the Usage tab render identical sizes (e.g. both "31GB", not 31 vs 32).
export const formatMemoryDisplay = (
  value?: string | number
): string | undefined => {
  if (!value) return undefined;
  const quantity = typeof value === 'number' ? `${value}Mi` : value;
  return (
    convertKiToGi(quantity)?.replace(/Gi$/, 'GB').replace(/Ti$/, 'TB') ||
    undefined
  );
};

const parseQuantity = (value?: string | null): number => {
  if (!value) return 0;
  const match = /^(-?\d+(?:\.\d+)?)/.exec(String(value));
  return match ? Number(match[1]) || 0 : 0;
};

// Returns the slider max for the accelerator count: the largest
// tier.onceMaxRequest.accelerator across all tiers (not from candidates).
export const getAcceleratorMax = (
  tiers?: { onceMaxRequest: { accelerator?: string | null } }[] | null
) => {
  if (!tiers?.length) return 0;
  return tiers.reduce((acc, tier) => {
    const n = parseQuantity(tier.onceMaxRequest?.accelerator);
    return n > acc ? n : acc;
  }, 0);
};

// Picks the candidate (cluster + type name) that should fulfill a requested
// accelerator count: the first candidate of the smallest tier whose
// onceMaxRequest.accelerator is >= the requested count. Only Active candidates
// are eligible. Accelerated types are not gated on CPU remaining (only CPU-only
// types are); in sliced mode the candidate's acceleratorSliced remaining must
// also be > 0, and in partitioned mode the candidate must still offer the
// requested profile (its acceleratorSlicedDetail lists it with count > 0).
export const pickCandidateForAccelerator = <
  C extends {
    cluster: string;
    name: string;
    phase?: string | null;
    cpu?: { remaining?: string | null } | null;
    acceleratorSliced?: { remaining?: string | null } | null;
    acceleratorPartitioned?: InstanceTypePartitionedResource | null;
    acceleratorSlicedDetail?: AcceleratorSlicedDetail | null;
  }
>(
  tiers:
    | {
        onceMaxRequest: {
          accelerator?: string | null;
          acceleratorSliced?: string | null;
        };
        remaining?: {
          acceleratorPartitioned?: AcceleratorProfileCount[] | null;
        } | null;
        candidates?: C[] | null;
      }[]
    | undefined
    | null,
  {
    count,
    acceleratable,
    sliced,
    partitionedProfile
  }: {
    count: number;
    acceleratable?: boolean;
    sliced?: boolean;
    partitionedProfile?: string | null;
  }
): C | null => {
  if (!tiers?.length) return null;

  const hasResources = (c: C) => {
    // Only Active candidates can serve new instances.
    if (c.phase !== InstanceTypePhaseValueMap.Active) return false;
    // Accelerated types are not gated on CPU remaining; CPU-only types are.
    if (!acceleratable && parseQuantity(c.cpu?.remaining) <= 0) return false;
    if (sliced && parseQuantity(c.acceleratorSliced?.remaining) <= 0)
      return false;
    // Match the requested profile by name against this candidate's own ledger —
    // the type-level view is a Σ across candidates, so a profile the type offers
    // may have nothing left in this particular cluster. Falls back to the
    // capability catalog only when the candidate published no ledger at all.
    if (
      partitionedProfile &&
      !getSelectablePartitionProfilesFromResource(
        c.acceleratorPartitioned,
        c.acceleratorSlicedDetail
      ).includes(partitionedProfile)
    )
      return false;
    return true;
  };

  const sorted = [...tiers].sort(
    (a, b) =>
      parseQuantity(a.onceMaxRequest?.accelerator) -
      parseQuantity(b.onceMaxRequest?.accelerator)
  );

  // count === 0 ? parseQuantity(tier.onceMaxRequest.accelerator) > count; this is CPU-only case.
  for (const tier of sorted) {
    const acceleratorCount = parseQuantity(tier.onceMaxRequest?.accelerator);
    // Sliced / partitioned modes request a fraction of a single card, so the
    // tier's whole-card accelerator count (0 for a slice-only type) can't gate
    // them; fit on the tier's sliced / partitioned capacity instead.
    // A partition request is one instance on one card, so "can one more of this
    // profile be built in this tier" is exactly "the tier's remaining ledger
    // counts it above zero" — that ledger is the Σ over the tier's Active
    // candidates, so a listed profile means some candidate here can serve it.
    //
    // NOT the tier's onceMaxRequest: that bundle is winner-takes-all, and because
    // the tier key IS Accelerator.OnceMaxRequest every candidate in a tier ties on
    // it, so the winner is simply the FIRST Active candidate. Its capped ledger
    // describes one cluster, not the tier — and since a MIG-mode card is never a
    // free whole card, every MIG pool in the fleet collapses into the
    // accelerator-0 tier. Gating on it lets one fully-carved cluster veto profiles
    // the fleet can still build, which the dropdown (reading the Σ) still offers.
    //
    // Absent ledger (an older server) means we cannot tell at tier level, so we do
    // not gate here and let the candidate check decide.
    const partitionedFits = () => {
      const obtainable = obtainablePartitionProfiles(
        tier.remaining?.acceleratorPartitioned
      );
      return obtainable === null || obtainable.includes(partitionedProfile!);
    };
    const fits = partitionedProfile
      ? partitionedFits()
      : sliced
        ? parseQuantity(tier.onceMaxRequest?.acceleratorSliced) > 0
        : acceleratable
          ? acceleratorCount >= count
          : acceleratorCount === 0;
    if (!fits) continue;
    const candidate = tier.candidates?.find(hasResources);
    if (candidate) return candidate;
  }
  return null;
};
