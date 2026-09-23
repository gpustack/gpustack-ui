import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Input, Select, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { loadTypeOptions, targetModeOptions } from '../config';

export interface RightActionsProps {
  handleSearch: () => void;
  handleQueryChange: (value: any, option?: any) => void;
  modelList?: Global.BaseOption<number, { categories: string[] }>[];
  toggleFilters: () => void;
  count?: number;
  onClear: () => void;
}

const RightActions: React.FC<RightActionsProps> = ({
  handleSearch,
  handleQueryChange,
  toggleFilters,
  count,
  onClear,
  modelList
}) => {
  const intl = useIntl();

  // Names go to the API comma-separated, matching any of them. Comparing runs
  // means pulling up exactly the handful being compared, which one substring
  // rarely spans — and a benchmark name cannot contain a comma or a space, so
  // neither separator is ambiguous.
  const handleNamesChange = (values: string[]) => {
    handleQueryChange({
      page: 1,
      search: values.join(',')
    });
  };

  const debounceUpdateFilter = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      gpu_summary: e.target.value
    });
  }, 350);

  const handleGPUChange = debounceUpdateFilter;

  const handleSearchByModelDebounce = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      model_name: e.target.value
    });
  }, 350);

  const handleSearchByProfileDebounce = _.debounce((e: any) => {
    handleQueryChange({
      page: 1,
      profile: e.target.value
    });
  }, 350);

  return (
    <Space>
      {/* antd's Select rather than core-ui's BaseSelect: BaseSelect always
          renders an "empty" illustration for the dropdown, and this field has
          no options to offer — every entry is typed. `notFoundContent={null}`
          keeps the dropdown to the one "add this name" row antd puts there. */}
      <Select
        mode="tags"
        allowClear
        notFoundContent={null}
        tokenSeparators={[',', ' ']}
        maxTagCount="responsive"
        suffixIcon={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({
          id: 'common.filter.name'
        })}
        style={{ width: 240 }}
        onChange={handleNamesChange}
      ></Select>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({
          id: 'benchmark.table.filter.bymodel'
        })}
        style={{ width: 180 }}
        allowClear
        onChange={handleSearchByModelDebounce}
      ></Input>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({ id: 'benchmark.table.filter.bygpu' })}
        style={{ width: 160 }}
        allowClear
        onChange={handleGPUChange}
      ></Input>
      <Input
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          ></SearchOutlined>
        }
        placeholder={intl.formatMessage({
          id: 'benchmark.table.filter.byProfile'
        })}
        style={{ width: 160 }}
        allowClear
        onChange={handleSearchByProfileDebounce}
      ></Input>
      <BaseSelect
        allowClear
        placeholder={intl.formatMessage({
          id: 'benchmark.table.filter.byTargetMode'
        })}
        style={{ width: 180 }}
        options={targetModeOptions.map((item) => ({
          label: intl.formatMessage({ id: item.label }),
          value: item.value
        }))}
        onChange={(value) =>
          handleQueryChange({
            target_mode: value,
            page: 1
          })
        }
      ></BaseSelect>
      <BaseSelect
        allowClear
        placeholder={intl.formatMessage({
          id: 'benchmark.table.filter.byLoadType'
        })}
        style={{ width: 160 }}
        options={loadTypeOptions.map((item) => ({
          label: intl.formatMessage({ id: item.label }),
          value: item.value
        }))}
        onChange={(value, option) =>
          handleQueryChange({
            load_type: value,
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
