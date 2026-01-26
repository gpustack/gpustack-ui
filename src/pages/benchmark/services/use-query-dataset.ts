import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useState } from 'react';
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

  const [datasetList, setDatasetList] = useState<
    Global.BaseOption<number | string>[]
  >([]);

  const fetchDatasetData = async () => {
    const items = await fetchData({
      page: -1
    });
    const list =
      items?.map((item) => ({
        ...item,
        label: item.name,
        value: item.id
      })) || [];

    setDatasetList([
      ...list,
      {
        label: 'Custom',
        value: 'Custom'
      }
    ]);
  };

  return {
    datasetList,
    loading,
    fetchDatasetData,
    cancelRequest
  };
};

export default useQueryDataset;
