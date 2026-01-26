import BaseSelect from '@/components/seal-form/base/select';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React from 'react';

export interface RightActionsProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  handleQueryChange: (value: any, option?: any) => void;
  modelList?: Global.BaseOption<number>[];
  datasetList?: Global.BaseOption<string>[];
  gpuVendorList?: Global.BaseOption<string>[];
}

const RightActions: React.FC<RightActionsProps> = ({
  handleInputChange,
  handleSearch,
  handleQueryChange,
  modelList,
  datasetList,
  gpuVendorList
}) => {
  const intl = useIntl();

  return (
    <Space>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({
          id: 'common.filter.name'
        })}
        style={{ width: 230 }}
        allowClear
        onChange={handleInputChange}
      ></Input>
      <BaseSelect
        allowClear
        placeholder="Filter by model"
        style={{ width: 150 }}
        options={modelList}
        onChange={(value, option) =>
          handleQueryChange({
            model_name: value,
            page: 1
          })
        }
      ></BaseSelect>
      <BaseSelect
        allowClear
        placeholder="Filter by dataset"
        style={{ width: 150 }}
        options={datasetList}
        onChange={(value, option) =>
          handleQueryChange({
            dataset_name: value,
            page: 1
          })
        }
      ></BaseSelect>
      <BaseSelect
        allowClear
        placeholder="Filter by GPU vendor"
        onChange={(value, option) =>
          handleQueryChange({
            gpu_summary: value,
            page: 1
          })
        }
        style={{ width: 180 }}
        options={gpuVendorList}
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

export default RightActions;
