import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { queryDatasetList } from '../apis';
import { DatasetListItem } from '../config/types';

const useQueryDataset = () => {
  const intl = useIntl();
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
        label: intl.formatMessage({ id: 'backend.custom' }),
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
