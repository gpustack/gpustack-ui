import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useState } from 'react';
import { queryDatasetList } from '../apis';
import { datasetList as datasetOptions } from '../config';
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
    // TODO: may be fetch data from server in the future.

    setDatasetList([...datasetOptions]);
    return datasetOptions;
  };

  return {
    datasetList,
    loading,
    fetchDatasetData,
    cancelRequest
  };
};

export default useQueryDataset;
