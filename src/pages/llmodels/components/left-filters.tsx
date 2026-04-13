import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { FiltersButton } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React from 'react';

interface LeftFiltersProps {
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClusterChange: (value: number) => void;
  handleStatusChange: (value: string) => void;
  handleSearch: () => void;
  handleCategoryChange: (value: string) => void;
  onFilterChange: (allValues: any) => void;
  clusterList: Global.BaseOption<number>[];
  toggleFilters: () => void;
  onClear: () => void;
  count?: number;
}

const LeftFilters: React.FC<LeftFiltersProps> = (props) => {
  const {
    handleNameChange,
    handleClusterChange,
    handleStatusChange,
    handleSearch,
    handleCategoryChange,
    onFilterChange,
    clusterList,
    toggleFilters,
    onClear,
    count
  } = props;
  const intl = useIntl();

  return (
    <Space>
      <FiltersButton
        onClick={toggleFilters}
        count={count}
        onClear={onClear}
      ></FiltersButton>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({ id: 'common.filter.name' })}
        style={{ width: 300 }}
        size="large"
        allowClear
        onChange={handleNameChange}
      ></Input>
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
