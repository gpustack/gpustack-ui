import { convertFileSizeByUnit } from '@/utils';
import _ from 'lodash';
import { ProviderType, ProviderValueMap } from '.';
import { RegionIcons } from './region-icons';

/**
 * Per-cloud-provider adapter.
 *
 * Every cloud provider exposes the same three lists to the cluster/node-pool
 * forms — regions, instance types, OS images — but reaches them over its own
 * proxy paths and returns its own payload shape. The adapter holds both, so
 * the form components and `useProviderRegions` stay provider-agnostic.
 *
 * The proxy paths are appended to
 * `/cloud-credentials/{credentialId}/provider-proxy`, i.e. the backend
 * forwards the call to the provider using the stored credential.
 */

export type RegionOption = {
  label: string;
  datacenter: string;
  value: string;
  icon: string;
  sizes: string[];
};

export type InstanceSpec = {
  vram: string | number;
  vcpus: number;
  ram: string | number;
  bootDisk: string | number;
  scratchDisk: string | number;
};

export type InstanceTypeOption = {
  label: string;
  value: string;
  description: string;
  /** GPUs per instance, when the provider reports it. */
  count?: number;
  vendor: string;
  /** Set when the spec cannot be ordered right now (e.g. sold out). */
  disabled?: boolean;
  regions: string[];
  /**
   * Shown as the option card's spec grid and stored on the pool as
   * `instance_spec` (display only, per the backend schema). Keys are looked up
   * in `instanceTypeFieldMap` for their labels, so a provider may report a
   * different set — keep the values pre-formatted strings.
   */
  specInfo: Record<string, any>;
};

export type OSImageOption = {
  label: string;
  value: string;
  os_image: string;
  name: string;
  description: string;
  vendor: string;
  regions: string[];
  specInfo: Record<string, any>;
};

export interface CloudProviderAdapter {
  /**
   * Paths under `{credential}/provider-proxy`, plus their query params.
   *
   * `regions` absent is the single declaration of "this provider has no
   * regions" — `providerHasRegions` derives the form's behaviour from it, and
   * there is no endpoint left for a caller to fire by accident.
   */
  proxy: {
    regions?: { path: string; params?: Record<string, any> };
    instanceTypes?: { path: string; params?: Record<string, any> };
    osImages?: { path: string; params?: Record<string, any> };
  };
  /** Whether node pools can attach block-storage volumes. */
  supportsVolumes: boolean;
  /** Label of the credential's secret field. */
  secretLabelId: string;
  /** Payload -> option list. Only GPU-capable, available entries. */
  parseRegions?: (res: any) => RegionOption[];
  parseInstanceTypes: (res: any) => InstanceTypeOption[];
  parseOSImages: (res: any) => OSImageOption[];
  /**
   * Narrow the full lists down to what the picked region offers. Omitted by a
   * region-less provider, where the full list is already the answer.
   */
  filterInstanceTypes?: (
    list: InstanceTypeOption[],
    region: string
  ) => InstanceTypeOption[];
  filterOSImages?: (list: OSImageOption[], region: string) => OSImageOption[];
  /**
   * `specInfo` keys that describe the moment rather than the spec (stock, live
   * pricing). They are shown on the option card but kept out of the pool's
   * stored `instance_spec`, which would otherwise display a number captured at
   * create time as though it were current.
   */
  volatileSpecKeys?: string[];
  /**
   * OS images that can run on the instance type the user picked in a node
   * pool (GPU vendor / GPU count rules). Return the list unchanged when the
   * provider has no such constraint.
   */
  matchOSImages: (
    list: OSImageOption[],
    instanceSpec: Record<string, any>
  ) => OSImageOption[];
  /**
   * Where the user goes to create the secret, if the provider documents such
   * a page — the console page itself when it survives an anonymous visit,
   * otherwise sign-in. The hint linking to it names the secret from
   * `secretLabelId`.
   */
  tokenDocUrl?: string;
}

// ===================== DigitalOcean =====================

const parseCityDatacenter = (
  input: string
): { label: string; datacenter: string } => {
  const parts = input.trim().split(' ');
  const number = parts.pop();
  const city = parts.join(' ');
  return {
    label: city,
    datacenter: `Datacenter ${number}`
  };
};

const parseSpec = (obj: any): InstanceSpec => {
  const gpuInfo = obj.gpu_info;
  const diskInfo = obj.disk_info;
  return {
    vram: convertFileSizeByUnit({
      sizeInBytes: gpuInfo?.vram?.amount || 0,
      defaultUnit: 'GiB'
    }),
    vcpus: obj.vcpus || 0,
    ram: convertFileSizeByUnit({
      sizeInBytes: obj.memory || 0,
      defaultUnit: 'MiB'
    }),
    bootDisk: convertFileSizeByUnit({
      sizeInBytes:
        diskInfo?.find((d: any) => d.type === 'local')?.size.amount || 0,
      defaultUnit: 'GiB'
    }),
    scratchDisk: convertFileSizeByUnit({
      sizeInBytes:
        diskInfo?.find((d: any) => d.type === 'scratch')?.size.amount || 0,
      defaultUnit: 'GiB'
    })
  };
};

const formatSpec = (spec: InstanceSpec): string => {
  const parts: string[] = [];

  if (spec.vram) parts.push(`${spec.vram} VRAM`);
  if (spec.vcpus) parts.push(`${spec.vcpus} vCPUs`);
  if (spec.ram) parts.push(`${spec.ram} RAM`);

  return parts.join(' / ');
};

const formatLabel = (instanceSpec: any): string => {
  return `${_.toUpper(instanceSpec.gpu_info?.model.replace(/_/g, ' '))}`;
};

const digitalOceanAdapter: CloudProviderAdapter = {
  supportsVolumes: true,
  secretLabelId: 'clusters.credential.token',
  proxy: {
    regions: { path: '/v2/regions', params: { per_page: 200 } },
    instanceTypes: { path: '/v2/sizes', params: { per_page: 200 } },
    osImages: {
      path: '/v2/images',
      params: { per_page: 200, type: 'distribution' }
    }
  },
  parseRegions: (res: any) =>
    res?.regions
      ?.filter?.(
        (sItem: any) =>
          sItem.sizes.some((size: string) => size.includes('gpu')) &&
          sItem.available
      )
      .map((item: any) => ({
        ...parseCityDatacenter(item.name),
        value: item.slug,
        icon: RegionIcons[item.slug],
        sizes: item.sizes || []
      })) || [],
  parseInstanceTypes: (res: any) =>
    res?.sizes
      ?.filter((sItem: any) => sItem.gpu_info && sItem.available)
      .map((item: any) => {
        const specInfo = parseSpec(item);
        const label = formatLabel(item);
        const description = `${label} ${item.gpu_info?.count}X`;
        return {
          count: item.gpu_info?.count,
          label: `${description} - ${formatSpec(specInfo)}`,
          value: item.slug,
          description: description,
          specInfo: specInfo,
          vendor: _.get(_.split(item.gpu_info?.model, '_'), 0),
          regions: item.regions || []
        };
      }) || [],
  parseOSImages: (res: any) =>
    res?.images
      ?.filter((sItem: any) => sItem.status === 'available')
      .map((item: any) => ({
        label: item.description,
        value: item.description,
        os_image: item.slug,
        name: item.name,
        description: item.description,
        vendor: _.camelCase(item.distribution),
        specInfo: {},
        regions: item.regions || []
      })) || [],
  filterInstanceTypes: (list, region) =>
    list.filter((item) => item.regions.includes(region)),
  filterOSImages: (list, region) =>
    list.filter(
      (item) =>
        item.regions.includes(region) &&
        ['debian', 'ubuntu'].includes(item.vendor)
    ),
  matchOSImages: (list, instanceSpec) => {
    if (instanceSpec.count === 8) {
      return list.filter((item) => item.os_image === 'gpu-h100x8-base');
    }

    if (instanceSpec.count === 1 && instanceSpec.vendor === 'amd') {
      return list.filter((item) => item.os_image === 'gpu-amd-base');
    }

    if (instanceSpec.count === 1 && instanceSpec.vendor === 'nvidia') {
      return list.filter((item) => item.os_image === 'gpu-h100x1-base');
    }

    return list;
  },
  // Deep link: an authenticated user lands on the token page itself, and an
  // anonymous one is bounced through login back to it.
  tokenDocUrl: 'https://cloud.digitalocean.com/account/api/tokens'
};

// ===================== Shuihua =====================

/**
 * Shuihua's open API (`/api/v1/open`, bearer API key — see the backend's
 * `cloud_providers/shuihua.py` and `open-api.openapi_v5.json`). Three traits
 * make it leaner than DigitalOcean's:
 *
 *   - no regions: the client ignores `region` entirely, so there is nothing to
 *     pick and nothing to filter the other two lists by;
 *   - no block storage, so node pools cannot attach volumes;
 *   - an instance type is a *spec template* (`template_id`, submitted as the
 *     pool's `instance_type`) and an image is a `image_uuid` (submitted as
 *     `os_image`); every payload is wrapped in `{ data: [...] }`.
 */
const shuihuaAdapter: CloudProviderAdapter = {
  supportsVolumes: false,
  secretLabelId: 'apikeys.form.apikey',
  proxy: {
    instanceTypes: { path: '/api/v1/open/gpu-instances' },
    osImages: { path: '/api/v1/open/images' }
  },
  volatileSpecKeys: ['remaining'],
  parseInstanceTypes: (res: any) =>
    (res?.data || [])
      .filter((item: any) => item?.template_id != null)
      .map((item: any) => {
        const gpuModel = _.toUpper(item.gpu_model || '');
        const description = item.name || gpuModel;
        // The API reports a bare number with no currency field (see
        // `open-api.openapi_v5.json`), and this provider prices in CNY.
        const price =
          item.price_per_hour != null ? `¥${item.price_per_hour}` : '';
        const specInfo = {
          gpuModel,
          pricePerHour: price ? `${price}/h` : '',
          // A string so the spec grid keeps rendering "0" — it drops falsy
          // values, and "sold out" is exactly what the user needs to see.
          remaining: item.remaining != null ? `${item.remaining}` : ''
        };
        const specText = [gpuModel, specInfo.pricePerHour]
          .filter(Boolean)
          .join(' / ');
        return {
          label: specText ? `${description} - ${specText}` : description,
          // `pool.instance_type` -> `int(template_id)` on the backend.
          value: `${item.template_id}`,
          description,
          specInfo,
          // Shuihua only rents NVIDIA GPUs (its images ship the driver
          // preinstalled), so the vendor is fixed rather than reported.
          vendor: 'nvidia',
          // Kept in the list rather than filtered out: "A100 — 0 remaining"
          // explains why a spec cannot be picked, an absent row does not.
          disabled: (item.remaining ?? 0) <= 0,
          regions: []
        };
      }),
  parseOSImages: (res: any) =>
    (res?.data || [])
      .filter((item: any) => item?.image_uuid)
      .map((item: any) => {
        const name = item.name || item.image_uuid;
        return {
          label: name,
          value: name,
          // `pool.os_image` -> the API's `image_id` on create.
          os_image: item.image_uuid,
          name,
          description: item.os_distro ? `${name} (${item.os_distro})` : name,
          vendor: _.camelCase(item.os_distro || ''),
          specInfo: {},
          regions: []
        };
      }),
  // Region-less, and no image is tied to a particular spec template, so the
  // full lists are already the node pool's options.
  matchOSImages: (list) => list,
  tokenDocUrl: 'https://hub.do.top/cn/signin'
};

export const cloudProviderAdapters: Record<string, CloudProviderAdapter> = {
  [ProviderValueMap.DigitalOcean]: digitalOceanAdapter,
  [ProviderValueMap.Shuihua]: shuihuaAdapter
};

/**
 * Stands in for a provider that is not resolved yet, so a form renders empty
 * instead of throwing. Deliberately neutral rather than a copy of some real
 * provider: no proxy paths (nothing to fetch), no region step, and no volumes
 * block the backend would reject. An empty picker is a visible problem; one
 * silently filled with another provider's rules is not.
 */
const neutralAdapter: CloudProviderAdapter = {
  proxy: {},
  supportsVolumes: false,
  secretLabelId: 'clusters.credential.token',
  parseInstanceTypes: () => [],
  parseOSImages: () => [],
  matchOSImages: (list) => list
};

export const getCloudProviderAdapter = (
  provider?: ProviderType | string | null
): CloudProviderAdapter =>
  cloudProviderAdapters[provider as string] || neutralAdapter;

/**
 * Whether the provider places instances in a region the user has to pick.
 * False (Shuihua) hides the cluster form's region field — the backend's
 * `region` is optional and its client ignores the value — and makes the full
 * instance-type / image lists the node pool's options.
 */
export const providerHasRegions = (provider?: ProviderType | string | null) =>
  !!getCloudProviderAdapter(provider).proxy.regions;
