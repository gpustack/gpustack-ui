import {
  allRegionInstanceTypeListAtom,
  allRegionOSImageListAtom,
  regionInstanceTypeListAtom,
  regionListAtom,
  regionOSImageListAtom
} from '@/atoms/clusters';
import { convertFileSizeByUnit } from '@/utils';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useState } from 'react';
import {
  queryDigitalOceanInstanceTypes,
  queryDigitalOceanOSImages,
  queryDigitalOceanRegions
} from '../apis';
import { RegionIcons } from '../config/region-icons';

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

type ParsedSpec = {
  vram: string | number;
  vcpus: number;
  ram: string | number;
  bootDisk: string | number;
  scratchDisk: string | number;
};

export const parseSpec = (obj: any): ParsedSpec => {
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

const formatSpec = (spec: ParsedSpec): string => {
  const parts: string[] = [];

  if (spec.vram) parts.push(`${spec.vram} VRAM`);
  if (spec.vcpus) parts.push(`${spec.vcpus} vCPUs`);
  if (spec.bootDisk) parts.push(`${spec.bootDisk} Boot disk`);
  if (spec.ram) parts.push(`${spec.ram} RAM`);
  if (spec.scratchDisk) {
    parts.push(`${spec.scratchDisk} Scratch disk`);
  }

  return parts.join(' / ');
};

export const useProviderRegions = () => {
  const [regions, setRegions] = useAtom(regionListAtom);
  const [, setInstanceTypes] = useAtom(regionInstanceTypeListAtom);
  const [, setOSImageList] = useAtom(regionOSImageListAtom);
  const [allOSImageList, setAllOSImageList] = useAtom(allRegionOSImageListAtom);
  const [allInstanceTypes, setAllInstanceTypes] = useAtom(
    allRegionInstanceTypeListAtom
  );
  const [loading, setLoading] = useState(false);

  const getRegions = async (credential: number) => {
    try {
      setLoading(true);
      const res = await queryDigitalOceanRegions({ id: credential });
      const list = res?.regions
        ?.filter?.(
          (sItem: any) =>
            sItem.sizes.some((size: string) => size.includes('gpu')) &&
            sItem.available
        )
        .map((item: any) => {
          return {
            ...parseCityDatacenter(item.name),
            value: item.slug,
            icon: RegionIcons[item.slug],
            sizes: item.sizes || []
          };
        });
      setRegions(list);
    } catch (error) {
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  const getInstanceTypes = async (credential: number) => {
    try {
      const res = await queryDigitalOceanInstanceTypes({ id: credential });
      const list = res?.sizes
        ?.filter((sItem: any) => sItem.gpu_info && sItem.available)
        .map((item: any) => {
          const specInfo = parseSpec(item);
          return {
            label: formatSpec(specInfo),
            value: item.slug,
            description: item.description,
            specInfo: specInfo,
            vendor: _.get(_.split(item.gpu_info?.model, '_'), 0),
            available: item.available,
            regions: item.regions || []
          };
        });
      setAllInstanceTypes(list);
      return list;
    } catch (error) {
      setAllInstanceTypes([]);
    }
  };

  const getOSImages = async (credential: number) => {
    try {
      const res = await queryDigitalOceanOSImages({ id: credential });
      const list = res.images
        ?.filter((sItem: any) => sItem.status === 'available')
        .map((item: any) => {
          return {
            label: item.description,
            value: item.slug,
            name: item.name,
            description: item.description,
            vendor: _.camelCase(item.distribution),
            specInfo: {
              size: `${item.size_gigabytes} GiB`,
              minDiskSize: `${item.min_disk_size} GiB`
            },
            regions: item.regions || []
          };
        });
      setAllOSImageList(list);
      return list;
    } catch (error) {}
  };

  const updateInstanceTypes = (region: string, allTypes?: any[]) => {
    const sizes = (allTypes || allInstanceTypes).filter((item) =>
      item.regions.includes(region)
    );
    setInstanceTypes(sizes);
  };

  const updateOSImages = (region: string, allImages?: any[]) => {
    const list = (allImages || allOSImageList).filter((item) =>
      item.regions.includes(region)
    );
    setOSImageList(list);
  };

  return {
    regions,
    loading,
    setLoading,
    getRegions,
    getInstanceTypes,
    getOSImages,
    updateOSImages,
    updateInstanceTypes
  };
};
