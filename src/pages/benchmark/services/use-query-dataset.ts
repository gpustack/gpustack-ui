import { useQueryDataList } from '@/hooks/use-query-data-list';
import { queryDatasetList } from '../apis';
import { DatasetListItem } from '../config/types';

const useQueryDataset = () => {
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    DatasetListItem,
    Global.SearchParams
  >({
    key: 'datasetList',
    fetchList: queryDatasetList
  });

  return {
    dataList,
    loading,
    fetchData,
    cancelRequest
  };
};

export default useQueryDataset;
