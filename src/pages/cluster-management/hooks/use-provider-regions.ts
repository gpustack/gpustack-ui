import {
  allRegionInstanceTypeListAtom,
  allRegionOSImageListAtom,
  regionInstanceTypeListAtom,
  regionListAtom,
  regionOSImageListAtom
} from '@/atoms/clusters';
import { useAtom } from 'jotai';
import { useState } from 'react';
import {
  queryCloudInstanceTypes,
  queryCloudOSImages,
  queryCloudRegions
} from '../apis';
import { ProviderType } from '../config';
import {
  getCloudProviderAdapter,
  type InstanceTypeOption,
  type OSImageOption
} from '../config/cloud-providers';

/**
 * Regions / instance types / OS images for a cloud provider's cluster and
 * node-pool forms. Endpoints and payload parsing come from the provider's
 * adapter (`config/cloud-providers.ts`), so this hook holds only the request
 * sequence and the atoms every consumer reads.
 */
export const useProviderRegions = (provider?: ProviderType | string | null) => {
  const adapter = getCloudProviderAdapter(provider);
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
      const res = await queryCloudRegions({ id: credential, provider });
      setRegions(adapter.parseRegions?.(res) || []);
    } catch (error) {
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  const getInstanceTypes = async (credential: number) => {
    try {
      const res = await queryCloudInstanceTypes({ id: credential, provider });
      const list = adapter.parseInstanceTypes(res);
      setAllInstanceTypes(list);
      return list;
    } catch (error) {
      setAllInstanceTypes([]);
      return [];
    }
  };

  const getOSImages = async (credential: number) => {
    try {
      const res = await queryCloudOSImages({ id: credential, provider });
      const list = adapter.parseOSImages(res);
      setAllOSImageList(list);
      return list;
    } catch (error) {
      setAllOSImageList([]);
      return [];
    }
  };

  const updateInstanceTypes = (region: string, allTypes?: any[]) => {
    const list = (allTypes || allInstanceTypes) as InstanceTypeOption[];
    setInstanceTypes(adapter.filterInstanceTypes?.(list, region) || list);
  };

  const updateOSImages = (region: string, allImages?: any[]) => {
    const list = (allImages || allOSImageList) as OSImageOption[];
    setOSImageList(adapter.filterOSImages?.(list, region) || list);
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
