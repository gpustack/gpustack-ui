import { ListItem as workerListItem } from '@/pages/resources/config/types';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React from 'react';
import { categoryOptions } from '../config';
import useFilterStatus from '../hooks/use-filter-status';
interface LeftFiltersProps {
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClusterChange: (value: number) => void;
  handleStatusChange: (value: string) => void;
  handleWorkerChange?: (value: number) => void;
  handleCategoryChange?: (value: string) => void;
  handleSearch: () => void;
  clusterList: Global.BaseOption<number>[];
  workerList?: workerListItem[];
  showWorker?: boolean;
  showCategory?: boolean;
  filterOptions?: {
    optionList: {
      label: string;
      value: string;
      color: string;
    }[];
  };
}

const LeftFilters: React.FC<LeftFiltersProps> = (props) => {
  const {
    handleNameChange,
    handleClusterChange,
    handleStatusChange,
    handleWorkerChange,
    handleCategoryChange,
    handleSearch,
    clusterList,
    workerList = [],
    showWorker = true,
    showCategory = false,
    filterOptions
  } = props;
  const { labelRender, optionRender, statusOptions } =
    useFilterStatus(filterOptions);
  const intl = useIntl();

  return (
    <Space>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({ id: 'common.filter.name' })}
        style={{ width: 200 }}
        size="large"
        allowClear
        onChange={handleNameChange}
      ></Input>
      <BaseSelect
        allowClear
        showSearch={false}
        placeholder={intl.formatMessage({
          id: 'clusters.filterBy.cluster'
        })}
        style={{ width: 160 }}
        size="large"
        maxTagCount={1}
        onChange={handleClusterChange}
        options={clusterList}
      ></BaseSelect>
      {showCategory && (
        <BaseSelect
          allowClear
          showSearch={false}
          placeholder={intl.formatMessage({
            id: 'models.filter.category'
          })}
          style={{ width: 160 }}
          size="large"
          maxTagCount={1}
          onChange={handleCategoryChange}
          options={categoryOptions}
        ></BaseSelect>
      )}
      {showWorker && (
        <BaseSelect
          allowClear
          showSearch={false}
          placeholder={intl.formatMessage({
            id: 'resources.filter.worker'
          })}
          style={{ width: 160 }}
          size="large"
          maxTagCount={1}
          onChange={handleWorkerChange}
          options={workerList.map((worker) => ({
            label: worker.name,
            value: worker.id
          }))}
        ></BaseSelect>
      )}
      <BaseSelect
        allowClear
        showSearch={false}
        placeholder={intl.formatMessage({ id: 'common.filter.status' })}
        style={{ width: 180 }}
        size="large"
        maxTagCount={1}
        optionRender={optionRender}
        labelRender={labelRender}
        options={statusOptions}
        onChange={handleStatusChange}
      ></BaseSelect>
      <Button
        type="text"
        style={{ color: 'var(--ant-color-text-tertiary)' }}
        onClick={handleSearch}
        icon={<SyncOutlined></SyncOutlined>}
      ></Button>
    </Space>
  );
};

export default LeftFilters;
