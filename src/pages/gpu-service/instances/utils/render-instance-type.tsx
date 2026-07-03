/**
 * Canonical "Instance Type" cell renderer.
 *
 * This is the single source of truth for the Instance Type column: the GPU
 * Instances list ([use-instances-columns]) and the Usage GPU Instances table
 * both render through it, so the primary label + the categorized spec popover
 * (GPU / CPU / Memory / Disk) stay byte-for-byte identical.
 *
 * It operates on the GPU-service ``ListItem`` shape. Callers whose data has a
 * different shape (e.g. the Usage breakdown rows) build a minimal ``ListItem``
 * with ``buildInstanceTypeRecordFromMiB`` and feed it here.
 */
import _ from 'lodash';
import { parseJsonSafe, parseQuantityToGi } from '../../utils';
import InstanceTypeCell from '../components/instance-type-cell';
import { formatMemoryDisplay } from '../config';
import { InstanceTypeSpec, ListItem } from '../config/types';

// Minimal shape of the ``useIntl()`` result we depend on — keeps this module
// free of an intl package import.
type IntlLike = { formatMessage: (descriptor: { id: string }) => string };

const toGB = (v?: string | number) =>
  v ? `${v}`.replace('Gi', ' GB').replace('Mi', ' MB') : '-';

const buildResourcesData = (
  instanceType: {
    spec: InstanceTypeSpec;
  },
  options: {
    count: number;
  }
) => {
  const unitResourcesParsed = instanceType?.spec?.unitResourcesParsed;
  const acceleratable = instanceType?.spec?.acceleratable;
  const { count = 0 } = options;

  if (acceleratable) {
    return {
      accelerator: _.toString(count),
      cpu: unitResourcesParsed?.cpu?.cores
        ? count * unitResourcesParsed?.cpu?.cores
        : undefined,
      ram: unitResourcesParsed?.ram?.value
        ? count * unitResourcesParsed?.ram?.value
        : undefined
    };
  }
  return {};
};

// Memory (VRAM) percentage for a sliced instance; 0 when not sliced.
const getSliceMemoryPercentage = (record: ListItem) =>
  _.toNumber(record.spec?.resources?.acceleratorSlicedMemoryPercentage) || 0;

const formatResources = (
  instanceTypeSpec: { spec: InstanceTypeSpec },
  record: ListItem
) => {
  const resources = buildResourcesData(instanceTypeSpec, {
    count: _.toNumber(record.spec?.resources?.accelerator) || 0
  });

  if (!record.spec?.resources?.accelerator) {
    return {
      cpu: record.spec?.resources?.cpu
        ? `${record.spec?.resources?.cpu} vCPU`
        : '-',
      ram: record.spec?.resources?.ram
        ? toGB(record.spec?.resources?.ram)
        : '-',
      localStorage: record.spec?.resources?.localStorage
        ? toGB(record.spec?.resources?.localStorage)
        : '-'
    };
  }

  const sliceMemoryPercentage = getSliceMemoryPercentage(record);

  // Sliced: CPU / RAM carry the already-scaled values on spec.resources, and
  // VRAM is the per-card memory scaled by the memory percentage (floored,
  // min 1) — not the whole card's size.
  if (sliceMemoryPercentage > 0) {
    const vramGi = parseQuantityToGi(
      (instanceTypeSpec.spec as any)?.memory
    )?.value;
    const vram =
      vramGi != null
        ? `${Math.max(1, _.floor((vramGi * sliceMemoryPercentage) / 100))} GB`
        : undefined;

    return {
      cpu: record.spec?.resources?.cpu
        ? `${record.spec?.resources?.cpu} vCPU`
        : '-',
      ram: record.spec?.resources?.ram
        ? toGB(record.spec?.resources?.ram)
        : '-',
      vram,
      localStorage: record.spec?.resources?.localStorage
        ? toGB(record.spec?.resources?.localStorage)
        : undefined
    };
  }

  // VRAM = per-card GPU memory (a single card's size; not aggregated across
  // cards — the model's marquee spec).
  const vram = formatMemoryDisplay((instanceTypeSpec.spec as any)?.memory);

  return {
    cpu: resources.cpu ? `${resources.cpu} vCPU` : '-',
    ram: resources.ram ? `${resources.ram} GB` : '-',
    vram,
    localStorage: record.spec?.resources?.localStorage
      ? toGB(record.spec?.resources?.localStorage)
      : undefined
  };
};

// Spec popover categories, in render order.
type SpecCategory = 'gpu' | 'cpu' | 'ram' | 'disk';

export const renderInstanceType = (
  record: ListItem,
  options: {
    intl: IntlLike;
    // name → capacity (e.g. "20Gi") for referenced persistent volumes, so the
    // Disk → Persistent row can show the size instead of just the PV name.
    pvCapacityByName?: Record<string, string>;
    // Limit the spec popover to these categories (default: all). The Instance
    // Types breakdown only wants CPU + RAM, for example.
    categories?: SpecCategory[];
    // Override the primary label (default: derived "<product> x <count>" /
    // "CPU Only"). The Instance Types breakdown keeps its plain product name.
    title?: string;
  }
) => {
  const { intl, pvCapacityByName, categories } = options;
  const description =
    parseJsonSafe<any>(record?.description || '{}', {}).spec || {};
  const resources = formatResources({ spec: description }, record);
  const accelerator = record.spec?.resources?.accelerator;
  const sliceMemoryPercentage = getSliceMemoryPercentage(record);
  const isSliced = description.acceleratable && sliceMemoryPercentage > 0;
  const title =
    options.title ??
    (description.acceleratable
      ? isSliced
        ? `${description.product} (${sliceMemoryPercentage}%)`
        : `${description.product} x ${accelerator}`
      : 'CPU Only');

  const volume = (record.spec as any)?.volume;
  // Spec popover grouped by category (GPU / CPU / Memory / Disk), mirroring
  // the Deployments instance info icon: dark tooltip, per-category icon,
  // instance name as the title. Rows with no value are dropped.
  type Section = {
    key: SpecCategory;
    icon: string;
    name: string;
    rows: [string | null, string | undefined][];
  };
  const sections: Section[] = [];
  if (description.acceleratable) {
    sections.push({
      key: 'gpu',
      icon: 'icon-gpu',
      name: 'GPU',
      rows: [
        // Sliced instances show the ratio instead of a card count (always 1).
        isSliced
          ? [
              intl.formatMessage({ id: 'gpuservice.instance.sliced' }),
              `${sliceMemoryPercentage}%`
            ]
          : [
              intl.formatMessage({ id: 'gpuservice.table.count' }),
              accelerator ? `${accelerator}` : undefined
            ],
        [
          intl.formatMessage({ id: 'gpuservice.instance.section.type' }),
          description.product
        ],
        [
          intl.formatMessage({ id: 'gpuservice.instance.memory' }),
          resources.vram
        ]
      ]
    });
  }
  sections.push({
    key: 'cpu',
    icon: 'icon-cpu',
    name: 'CPU',
    rows: [[null, resources.cpu]]
  });
  sections.push({
    key: 'ram',
    icon: 'icon-ram-02',
    name: intl.formatMessage({ id: 'gpuservice.instance.ram' }),
    rows: [[null, resources.ram]]
  });
  sections.push({
    key: 'disk',
    icon: 'icon-hard-disk',
    name: intl.formatMessage({ id: 'gpuservice.instance.disk' }),
    rows: [
      [
        intl.formatMessage({ id: 'gpuservice.instance.disk.system' }),
        resources.localStorage
      ],
      [
        intl.formatMessage({ id: 'gpuservice.instance.disk.ephemeral' }),
        toGB(volume?.ephemeral?.capacity)
      ],
      [
        intl.formatMessage({ id: 'gpuservice.instance.disk.persistent' }),
        // toGB returns '-' (a truthy string) for falsy input, so only call it
        // when a value actually exists — otherwise the first branch would
        // short-circuit the chain and the PV fallbacks would never run.
        (volume?.persistentTemplate?.spec?.capacity &&
          toGB(volume.persistentTemplate.spec.capacity)) ||
          (volume?.persistent?.name &&
            pvCapacityByName?.[volume.persistent.name] &&
            toGB(pvCapacityByName[volume.persistent.name])) ||
          volume?.persistent?.name
      ]
    ]
  });

  const visibleSections = categories
    ? sections.filter((s) => categories.includes(s.key))
    : sections;

  return (
    <InstanceTypeCell
      title={title}
      name={record.name}
      sections={visibleSections}
    />
  );
};

// MiB → k8s "Gi" quantity string, so values that arrive as raw mebibytes (the
// Usage breakdown carries them this way) render through the same toGB path as
// the GPU Instances list — i.e. as "X GB", not "X MB".
const mibToGiQuantity = (mib?: number): string | undefined =>
  mib ? `${Math.round(mib / 1024)}Gi` : undefined;

// Per-card / whole-instance metrics carried by the Usage breakdown rows.
export interface InstanceTypeMiB {
  name?: string;
  product?: string;
  // accelerator (GPU card) count; 0/undefined → CPU-only ("CPU Only").
  gpuCount?: number;
  // Per-card values.
  unitCpuMilli?: number;
  unitMemoryMib?: number;
  vramMib?: number;
  // Disk (whole instance).
  localStorageMib?: number;
  ephemeralMib?: number;
  persistentMib?: number;
}

// Adapt the Usage breakdown's flat MiB fields into the ``ListItem`` shape the
// canonical renderer consumes, so both tables render identically. CPU/RAM ride
// on the parsed unit-resources (per card) for accelerated rows and on
// ``spec.resources`` for CPU-only rows, matching how the list derives them.
export const buildInstanceTypeRecordFromMiB = (
  data: InstanceTypeMiB
): ListItem => {
  const acceleratable = (data.gpuCount ?? 0) > 0;
  return {
    name: data.name,
    description: JSON.stringify({
      spec: {
        acceleratable,
        product: data.product,
        memory: data.vramMib,
        unitResourcesParsed: {
          cpu: data.unitCpuMilli ? { cores: data.unitCpuMilli / 1000 } : null,
          ram: data.unitMemoryMib ? { value: data.unitMemoryMib / 1024 } : null
        }
      }
    }),
    spec: {
      resources: {
        accelerator: data.gpuCount ? `${data.gpuCount}` : null,
        // Only the CPU-only branch reads cpu/ram off spec.resources.
        cpu: acceleratable
          ? null
          : data.unitCpuMilli
            ? data.unitCpuMilli / 1000
            : null,
        ram: acceleratable ? null : mibToGiQuantity(data.unitMemoryMib),
        localStorage: mibToGiQuantity(data.localStorageMib) ?? null
      },
      volume: {
        ephemeral: { capacity: mibToGiQuantity(data.ephemeralMib) },
        persistentTemplate: data.persistentMib
          ? {
              spec: { type: '', capacity: mibToGiQuantity(data.persistentMib)! }
            }
          : undefined
      }
    }
  } as ListItem;
};
