import useRangePickerPreset from '@/pages/dashboard/hooks/use-rangepicker-preset';
import { useModel } from '@@/plugin-model';
import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  Cascader,
  IconFont,
  SimpleSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Dropdown, MenuProps } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { GroupOption } from '../config';
import { UsageFilterItem } from '../config/types';
import FilterBarCss from '../styles/filter-bar.less';

type valueType = string | number | null;
const DefaultDateConfig = {
  maxRange: 90,
  defaultRange: 29
};
type OptionType = UsageFilterItem & {
  value: string;
};

type DateType = 'date' | 'week' | 'month' | 'quarter' | 'year';

interface FilterBarProps {
  pageType?: 'page' | 'modal';
  scope: string;
  startDate: string;
  endDate: string;
  selectedRoutes: string[];
  selectedUsers: string[];
  selectedApiKeys: string[];
  routeOptions: OptionType[];
  userOptions: OptionType[];
  apiKeyOptions: GroupOption<UsageFilterItem>[];
  activeApiKeys: valueType[][];
  handlePickerChange: (picker: DateType) => void;
  onScopeChange: (value: string) => void;
  onDateChange: (dates: any, dateStrings: [string, string]) => void;
  onRoutesChange: (value: string[]) => void;
  onUsersChange: (value: string[]) => void;
  onApiKeysChange: (value: string[]) => void;
  handleActiveApiKeysChange: (value: valueType[][]) => void;
  onExport?: () => void;
  handleSearch?: () => void;
  onExportChart?: () => void;
  onExportTable?: () => void;
  commonFilters?: {
    scope: string;
    start_date: string;
    end_date: string;
    routes: string[];
    users: string[];
    api_keys: string[];
  };
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    pageType = 'page',
    startDate,
    endDate,
    selectedRoutes,
    selectedUsers,
    selectedApiKeys,
    routeOptions,
    userOptions,
    apiKeyOptions,
    activeApiKeys,
    handleActiveApiKeysChange,
    handlePickerChange,
    onDateChange,
    onRoutesChange,
    onUsersChange,
    onApiKeysChange,
    onExportChart,
    onExportTable,
    handleSearch
  } = props;
  const intl = useIntl();
  const {
    disabledRangeDaysDate,
    rangePresets,
    picker,
    normalizeRangeValue,
    handleOnPickerChange
  } = useRangePickerPreset({
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
      label: (
        <span className="flex-center gap-8">
          <IconFont type="icon-chart-01" style={{ fontSize: 14 }} />
          <span>{intl.formatMessage({ id: 'usage.export.chart' })}</span>
        </span>
      ),
      onClick: onExportChart
    },
    {
      key: 'table',
      label: (
        <span className="flex-center gap-8">
          <IconFont type="icon-table" style={{ fontSize: 14 }} />
          <span>{intl.formatMessage({ id: 'usage.export.table' })}</span>
        </span>
      ),
      onClick: onExportTable
    }
  ];

  const renderTag = (tag: string) => {
    return (
      <span className="text-tertiary" style={{ fontSize: 12, marginRight: 4 }}>
        [{tag}]
      </span>
    );
  };

  const handleOnApiKeysChange = (
    value: valueType[][],
    selectedOptions: any
  ) => {
    const selectedValues: string[] = value.map((item) => {
      if (Array.isArray(item)) {
        return item[item.length - 1] as string; // Get the last value in the array
      }
      return item as string;
    });
    handleActiveApiKeysChange(value);
    onApiKeysChange(selectedValues);
  };

  const apiKeyOptionRender = (option: any) => {
    const { data } = option;
    if (!data.isParent) {
      return (
        <span className="flex-center gap-4">
          <AutoTooltip ghost>{data.label}</AutoTooltip>
          {data.deleted &&
            renderTag(intl.formatMessage({ id: 'usage.table.deleted' }))}
        </span>
      );
    }

    return (
      <AutoTooltip ghost>
        <span>{data.label}</span>
      </AutoTooltip>
    );
  };

  const singleOptionRender = (option: any) => {
    const { data } = option;
    return (
      <span className="flex-center gap-4">
        <AutoTooltip ghost>{data.label}</AutoTooltip>
        {data.deleted &&
          renderTag(intl.formatMessage({ id: 'usage.table.deleted' }))}
      </span>
    );
  };

  const onPickerChange = (picker: DateType) => {
    handleOnPickerChange(picker);
    handlePickerChange(picker);
  };

  const rangePickerValue: [dayjs.Dayjs, dayjs.Dayjs] =
    startDate && endDate
      ? normalizeRangeValue(startDate, endDate, picker)
      : [dayjs().add(-DefaultDateConfig.defaultRange, 'd'), dayjs()];

  const userOptionRender = (option: any) => {
    const { data } = option;
    return (
      <span className="flex-center gap-4">
        <AutoTooltip ghost>{data.label}</AutoTooltip>
        {data.isCurrent &&
          renderTag(intl.formatMessage({ id: 'usage.user.currentAccount' }))}
        {data.deleted &&
          renderTag(intl.formatMessage({ id: 'usage.table.deleted' }))}
      </span>
    );
  };

  // only for dates greater than the current day should be disabled.
  const disabledDate = (current: dayjs.Dayjs) => {
    return current && current > dayjs().endOf('day');
  };

  return (
    <div className={FilterBarCss.wrapper}>
      <div className={FilterBarCss.filters}>
        <DatePicker.RangePicker
          maxDate={dayjs()}
          value={rangePickerValue}
          format={'YYYY-MM-DD'}
          picker={picker}
          disabledDate={disabledDate}
          presets={rangePresets}
          allowClear={false}
          style={{ width: 240 }}
          onChange={onDateChange}
        />
        <SimpleSelect
          allowClear
          showSearch
          mode="multiple"
          options={routeOptions}
          placeholder={intl.formatMessage({ id: 'usage.filter.model' })}
          styles={{
            wrapper: { flex: 1, maxWidth: 400, minWidth: 200 }
          }}
          value={selectedRoutes}
          optionLabelRender={singleOptionRender}
          onChange={onRoutesChange}
        />
        {initialState?.currentUser?.is_admin && (
          <>
            <SimpleSelect
              allowClear
              showSearch
              mode="multiple"
              options={userOptions}
              placeholder={intl.formatMessage({ id: 'usage.filter.user' })}
              styles={{
                wrapper: { flex: 1, maxWidth: 240, minWidth: 150 }
              }}
              value={selectedUsers}
              optionLabelRender={userOptionRender}
              onChange={onUsersChange}
            />
            <div
              style={{
                maxWidth: 400,
                flex: 1,
                minWidth: 200
              }}
            >
              <Cascader
                showSearch
                isInFormItems={false}
                multiple={true}
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                styles={{
                  root: {
                    width: '100%'
                  },
                  popup: {
                    list: {
                      flex: 1
                    },
                    listItem: {
                      padding: '5px 10px'
                    }
                  }
                }}
                maxTagCount={1}
                size="small"
                placeholder={intl.formatMessage({ id: 'usage.filter.apikey' })}
                options={apiKeyOptions}
                showCheckedStrategy="SHOW_CHILD"
                value={activeApiKeys}
                optionNode={apiKeyOptionRender}
                onChange={handleOnApiKeysChange}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              ></Cascader>
            </div>
          </>
        )}
        {!initialState?.currentUser?.is_admin && (
          <SimpleSelect
            allowClear
            showSearch
            mode="multiple"
            options={apiKeyOptions?.[0]?.children || []}
            maxTagCount={0}
            placeholder={intl.formatMessage({ id: 'usage.filter.apikey' })}
            styles={{
              wrapper: { flex: 1, maxWidth: 240, minWidth: 100 }
            }}
            value={selectedApiKeys}
            optionRender={singleOptionRender}
            onChange={onApiKeysChange}
          />
        )}
        <Button
          type="text"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          onClick={handleSearch}
          icon={<SyncOutlined></SyncOutlined>}
        ></Button>
      </div>
      {pageType === 'page' && (
        <Dropdown menu={{ items: exportMenuItems }}>
          <Button icon={<DownloadOutlined />} />
        </Dropdown>
      )}
    </div>
  );
};

export default FilterBar;
