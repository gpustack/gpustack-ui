import { useQueryData } from '@gpustack/core-ui';
import React from 'react';
import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import { queryGPUServiceInstanceTypes } from '../apis';
import {
  getAcceleratorMax,
  isSliceableDetail,
  obtainablePartitionProfiles
} from '../config';
import { InstanceTypeItem } from '../config/types';

type InstanceType = InstanceTypeItem & {
  disabled?: boolean;
};

export default function useQueryInstanceTypes() {
  const fetchDetail = (
    params: Global.SearchParams = { page: 1, perPage: 100 },
    options?: any
  ) => queryGPUServiceInstanceTypes(params, options);

  const { detailData, loading, cancelRequest, fetchData } = useQueryData<
    Global.PageResponse<InstanceTypeItem>,
    Global.SearchParams
  >({
    fetchDetail,
    key: 'instanceTypes'
  });

  const [dataList, setDataList] = React.useState<InstanceType[]>([]);

  const isAvailable = (item: InstanceTypeItem) => {
    if (!item.spec?.acceleratable) {
      const max =
        ceilMilliToCore(item.status?.onceMaxRequest?.cpu || '0')?.cores || 0;
      return {
        maxComputeUnitCount: max, // CPU resource max request
        available: max > 0
      };
    }

    const max = getAcceleratorMax(item.status?.tiers);

    // Sliceable types stay selectable as long as whole-card, sliced (soft) or
    // partitioned (hard) capacity remains; unavailable only when all three of
    // onceMaxRequest.accelerator / onceMaxRequest.acceleratorSliced /
    // remaining.acceleratorPartitioned are 0.
    if (isSliceableDetail(item.status?.detail?.slicedDetail)) {
      const wholeMax = Number(item.status?.onceMaxRequest?.accelerator) || 0;
      const slicedMax =
        Number(item.status?.onceMaxRequest?.acceleratorSliced) || 0;
      // The partition dimension is a per-profile list, not a number — one entry
      // per profile the pool offers. So the count of obtainable profiles is what
      // stands in for a magnitude here. Reading it as a number instead yields
      // NaN → 0, which would take a MIG-only pool (whole-card 0, and sliced 0
      // because a MIG-mode card reports logical: {}) out of service entirely: the
      // type would vanish from the form even though every profile is available.
      // A server older than the ledger sends a scalar here, hence the null branch.
      //
      // Read from remaining, not onceMaxRequest: the latter is the winner-takes-all
      // bundle of one tier — itself one candidate's capped ledger — so a single
      // fully-carved cluster would grey the type out while the rest of the fleet
      // has room. remaining is the true Σ across Active candidates, and since a
      // partition request is always one instance on one card, "Σ > 0 for some
      // profile" is exactly "something here can still be requested".
      const partitionedProfiles = obtainablePartitionProfiles(
        item.status?.remaining?.acceleratorPartitioned
      );
      const partitionedMax =
        partitionedProfiles === null
          ? Number(item.status?.remaining?.acceleratorPartitioned) || 0
          : partitionedProfiles.length;
      return {
        maxComputeUnitCount: max || 0,
        available: wholeMax > 0 || slicedMax > 0 || partitionedMax > 0
      };
    }

    return {
      maxComputeUnitCount: max || 0,
      available: (max || 0) > 0
    };
  };

  const queryInstanceTypes = async (
    params: Global.SearchParams = { page: -1 }
  ) => {
    const res = await fetchData(params);

    const list = (res?.items || []).map((item) => {
      const remainingData = isAvailable(item);
      const rawMax = item.status?.onceMaxRequest;

      return {
        ...item,
        spec: {
          ...item.spec,
          unitResourcesParsed: {
            cpu: ceilMilliToCore(item.spec?.unitResources?.cpu ?? null),
            ram: parseQuantityToGi(item.spec?.unitResources?.ram ?? null)
          },
          maxComputeUnitCount: remainingData.maxComputeUnitCount
        },
        status: {
          ...item.status,
          // Normalize cpu (possibly millicores) to a whole-core count string;
          // the other onceMaxRequest fields are plain number strings already.
          onceMaxRequest: {
            ...rawMax,
            cpu: rawMax?.cpu ? `${ceilMilliToCore(rawMax.cpu)?.cores || 0}` : ''
          }
        },

        disabled: !remainingData.available
      };
    });

    setDataList(list);
    return list;
  };

  return {
    detailData: dataList,
    setDataList,
    loading,
    cancelRequest,
    fetchData: queryInstanceTypes
  };
}
