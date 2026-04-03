import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React from 'react';
import Filters from '../filters';
import useFilterStatus from '../hooks/use-filter-status';

interface LeftFiltersProps {
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClusterChange: (value: number) => void;
  handleStatusChange: (value: string) => void;
  handleSearch: () => void;
  handleCategoryChange: (value: string) => void;
  onFilterChange: (allValues: any) => void;
  clusterList: Global.BaseOption<number>[];
}

const LeftFilters: React.FC<LeftFiltersProps> = (props) => {
  const {
    handleNameChange,
    handleClusterChange,
    handleStatusChange,
    handleSearch,
    handleCategoryChange,
    onFilterChange,
    clusterList
  } = props;
  const { labelRender, optionRender, statusOptions } = useFilterStatus();
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
        style={{ width: 400 }}
        size="large"
        allowClear
        suffix={
          <Filters
            clusterList={clusterList}
            onValuesChange={onFilterChange}
          ></Filters>
        }
        onChange={handleNameChange}
      ></Input>

      {/* <BaseSelect
        allowClear
        showSearch={false}
        placeholder={intl.formatMessage({
          id: 'models.filter.category'
        })}
        style={{ width: 160 }}
        size="large"
        maxTagCount={1}
        onChange={handleCategoryChange}
        options={modelCategories.filter((item) => item.value)}
      ></BaseSelect>
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
      ></BaseSelect> */}
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
