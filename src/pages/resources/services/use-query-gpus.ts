import { useQueryDataList } from '@/hooks/use-query-data-list';
import { queryGpuDevicesList } from '../apis';
import { GPUDeviceItem as ListItem } from '../config/types';

export const useQueryGPUs = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'gpuList',
    fetchList: queryGpuDevicesList
  });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryGPUs;
