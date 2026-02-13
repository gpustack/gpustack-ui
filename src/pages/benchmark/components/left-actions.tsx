import BaseSelect from '@/components/seal-form/base/select';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import _ from 'lodash';
import React from 'react';

export interface RightActionsProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  handleQueryChange: (value: any, option?: any) => void;
  modelList?: Global.BaseOption<number, { categories: string[] }>[];
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

  const modelOptions = modelList
    ?.filter((item) => {
      return item.categories?.includes(modelCategoriesMap.llm);
    })
    .map((item) => ({
      label: item.label,
      value: item.label
    }));

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
        placeholder={intl.formatMessage({ id: 'benchmark.table.filter.bygpu' })}
        style={{ width: 180 }}
        allowClear
        onChange={handleGPUChange}
      ></Input>
      <BaseSelect
        allowClear
        placeholder={intl.formatMessage({
          id: 'benchmark.table.filter.bymodel'
        })}
        style={{ width: 200 }}
        options={modelOptions}
        onChange={(value, option) =>
          handleQueryChange({
            model_name: value,
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
