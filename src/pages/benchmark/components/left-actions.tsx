import BaseSelect from '@/components/seal-form/base/select';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import _ from 'lodash';
import React from 'react';

export interface RightActionsProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  handleQueryChange: (value: any, option?: any) => void;
  modelList?: Global.BaseOption<number>[];
  datasetList?: Global.BaseOption<string | number>[];
}

const RightActions: React.FC<RightActionsProps> = ({
  handleInputChange,
  handleSearch,
  handleQueryChange,
  modelList,
  datasetList
}) => {
  const intl = useIntl();

  const debounceUpdateFilter = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      gpu_summary: e.target.value
    });
  }, 350);

  const handleGPUChange = debounceUpdateFilter;

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
        style={{ width: 180 }}
        allowClear
        onChange={handleInputChange}
      ></Input>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder="Filter by GPU"
        style={{ width: 180 }}
        allowClear
        onChange={handleGPUChange}
      ></Input>
      <BaseSelect
        allowClear
        placeholder="Filter by model"
        style={{ width: 200 }}
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
        style={{ width: 200 }}
        options={datasetList?.map((item) => ({
          ...item,
          label: item.label,
          value: item.label
        }))}
        onChange={(value, option) =>
          handleQueryChange({
            dataset_name: value,
            page: 1
          })
        }
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
