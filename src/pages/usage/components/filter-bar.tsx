import SimpleSelect from '@/components/seal-form/simple-select';
import useRangePickerPreset from '@/pages/dashboard/hooks/use-rangepicker-preset';
import { useModel } from '@@/plugin-model';
import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Dropdown, MenuProps } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { UsageFilterItem } from '../config/types';
import FilterBarCss from '../styles/filter-bar.less';

const DefaultDateConfig = {
  maxRange: 90,
  defaultRange: 29
};
type OptionType = UsageFilterItem & {
  value: string;
};
interface FilterBarProps {
  scope: string;
  startDate: string;
  endDate: string;
  selectedModels: string[];
  selectedUsers: string[];
  selectedApiKeys: string[];
  modelOptions: OptionType[];
  userOptions: OptionType[];
  apiKeyOptions: OptionType[];
  onScopeChange: (value: string) => void;
  onDateChange: (dates: any, dateStrings: [string, string]) => void;
  onModelsChange: (value: string[]) => void;
  onUsersChange: (value: string[]) => void;
  onApiKeysChange: (value: string[]) => void;
  onExport?: () => void;
  handleSearch?: () => void;
  onExportChart: () => void;
  onExportTable: () => void;
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    scope,
    startDate,
    endDate,
    selectedModels,
    selectedUsers,
    selectedApiKeys,
    modelOptions,
    userOptions,
    apiKeyOptions,
    onScopeChange,
    onDateChange,
    onModelsChange,
    onUsersChange,
    onApiKeysChange,
    onExportChart,
    onExportTable,
    handleSearch
  } = props;
  const intl = useIntl();
  const { disabledRangeDaysDate, rangePresets } = useRangePickerPreset({
    range: DefaultDateConfig.maxRange,
    disabledDate: true,
    presetRanges: [
      {
        label: intl.formatMessage({
          id: 'dashboard.usage.datePicker.last7days'
        }),
        value: [dayjs().add(-6, 'd'), dayjs()]
      },
      {
        label: intl.formatMessage({
          id: 'dashboard.usage.datePicker.last30days'
        }),
        value: [dayjs().add(-29, 'd'), dayjs()]
      },
      {
        label: intl.formatMessage({
          id: 'dashboard.usage.datePicker.last60days'
        }),
        value: [dayjs().add(-59, 'd'), dayjs()]
      },
      {
        label: intl.formatMessage({
          id: 'dashboard.usage.datePicker.last90days'
        }),
        value: [dayjs().add(-89, 'd'), dayjs()]
      }
    ]
  });
  const initialInfo = useModel('@@initialState');
  const { initialState } = initialInfo || {};

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'chart',
      label: 'Export Chart Data',
      onClick: onExportChart
    },
    {
      key: 'table',
      label: 'Export Table Data',
      onClick: onExportTable
    }
  ];

  return (
    <div className={FilterBarCss.wrapper}>
      <div className={FilterBarCss.filters}>
        {/* {initialState?.currentUser?.is_admin && (
          <BaseSelect
            options={scopeOptions}
            value={scope}
            onChange={onScopeChange}
            style={{ width: 150 }}
          />
        )} */}
        <DatePicker.RangePicker
          maxDate={dayjs()}
          defaultValue={[
            dayjs().add(-DefaultDateConfig.defaultRange, 'd'),
            dayjs()
          ]}
          disabledDate={disabledRangeDaysDate}
          presets={rangePresets}
          allowClear={false}
          style={{ width: 240 }}
          value={[dayjs(startDate), dayjs(endDate)]}
          onChange={onDateChange}
        />
        <SimpleSelect
          allowClear
          showSearch
          mode="multiple"
          options={modelOptions}
          maxTagCount={0}
          placeholder="Model"
          styles={{
            wrapper: { flex: 1, maxWidth: 300, minWidth: 150 }
          }}
          value={selectedModels}
          onChange={onModelsChange}
        />
        {initialState?.currentUser?.is_admin && (
          <SimpleSelect
            allowClear
            showSearch
            mode="multiple"
            options={userOptions}
            placeholder="User"
            styles={{
              wrapper: { flex: 1, maxWidth: 240, minWidth: 150 }
            }}
            value={selectedUsers}
            onChange={onUsersChange}
          />
        )}
        <SimpleSelect
          allowClear
          showSearch
          mode="multiple"
          options={apiKeyOptions}
          maxTagCount={0}
          placeholder="API Key"
          styles={{
            wrapper: { flex: 1, maxWidth: 240, minWidth: 100 }
          }}
          value={selectedApiKeys}
          onChange={onApiKeysChange}
        />
        <Button
          type="text"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          onClick={handleSearch}
          icon={<SyncOutlined></SyncOutlined>}
        ></Button>
      </div>
      <Dropdown menu={{ items: exportMenuItems }}>
        <Button icon={<DownloadOutlined />} />
      </Dropdown>
    </div>
  );
};

export default FilterBar;
