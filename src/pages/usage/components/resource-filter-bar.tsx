/**
 * Filter bar shared by the resource tabs (Summary / GPU Instances / Storage /
 * Resource Events). Visually and behaviourally mirrors the Tokens tab's
 * ``FilterBar``: a date range picker (with the same presets) plus — for users
 * who can manage the org — a "filter by user" multi-select. There is no
 * explicit All/My scope dropdown; managers default to the org-wide view and
 * narrow it via the user select, non-managers only ever see their own rows.
 *
 * ``extra`` lets a tab append its own filters (e.g. Resource Events' resource
 * type / event type) inline, keeping one consistent bar.
 */
import PluginExtraFields from '@/components/plugin-extra-fields';
import useRangePickerPreset from '@/pages/dashboard/hooks/use-rangepicker-preset';
import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { AutoTooltip, IconFont, SimpleSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Dropdown, MenuProps } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import FilterBarCss from '../styles/filter-bar.less';
import DeletedTag from './deleted-tag';

const DefaultDateConfig = {
  maxRange: 90,
  defaultRange: 29
};

interface SelectOption {
  value: number;
  label: string;
  deleted?: boolean;
  isCurrent?: boolean;
}

// Optional per-tab entity filter (GPU instance on the GPU tab / volume on the
// Storage tab). Rendered as a multi-select right after the user filter.
interface ResourceEntityFilter {
  options: SelectOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
}

interface ResourceFilterBarProps {
  value: [dayjs.Dayjs, dayjs.Dayjs];
  onChange: (dates: [dayjs.Dayjs, dayjs.Dayjs]) => void;
  canManageUsers: boolean;
  userOptions: SelectOption[];
  selectedUsers: number[];
  onUsersChange: (ids: number[]) => void;
  resourceFilter?: ResourceEntityFilter;
  onRefresh?: () => void;
  // When provided, an Export dropdown (matching the Tokens tab) is shown with
  // "Export Chart Data" / "Export Table Data" entries.
  onExportChart?: () => void;
  onExportTable?: () => void;
  extra?: React.ReactNode;
  // Platform-wide "All" view only; empty otherwise (backend-gated). Rendered
  // by the enterprise ``ResourceUsageFilterBar`` slot.
  organizationOptions?: SelectOption[];
  userGroupOptions?: SelectOption[];
  selectedOrganizations?: number[];
  selectedUserGroups?: number[];
  onOrganizationsChange?: (ids: number[]) => void;
  onUserGroupsChange?: (ids: number[]) => void;
}

const ResourceFilterBar: React.FC<ResourceFilterBarProps> = (props) => {
  const {
    value,
    onChange,
    canManageUsers,
    userOptions,
    selectedUsers,
    onUsersChange,
    resourceFilter,
    onRefresh,
    onExportChart,
    onExportTable,
    extra,
    organizationOptions,
    userGroupOptions,
    selectedOrganizations,
    selectedUserGroups,
    onOrganizationsChange,
    onUserGroupsChange
  } = props;
  const intl = useIntl();

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

  const { rangePresets, picker, normalizeRangeValue } = useRangePickerPreset({
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

  // only dates after today should be disabled.
  const disabledDate = (current: dayjs.Dayjs) =>
    current && current > dayjs().endOf('day');

  const rangePickerValue: [dayjs.Dayjs, dayjs.Dayjs] =
    value?.[0] && value?.[1]
      ? normalizeRangeValue(
          value[0].format('YYYY-MM-DD'),
          value[1].format('YYYY-MM-DD'),
          picker
        )
      : [dayjs().add(-DefaultDateConfig.defaultRange, 'd'), dayjs()];

  const renderTag = (tag: string) => (
    <span className="text-tertiary" style={{ fontSize: 12, marginRight: 4 }}>
      [{tag}]
    </span>
  );

  const deletedLabelStyle = (deleted?: boolean) =>
    deleted ? { color: 'var(--ant-color-text-tertiary)' } : undefined;

  // The user / instance / volume filters mirror the Tokens tab: the option
  // ``value`` is the entity id, so a deleted entry stays distinguishable via the
  // "Deleted·#{id}" tag.
  const userOptionRender = (option: any) => {
    const { data } = option;
    return (
      <span className="flex-center gap-4">
        <AutoTooltip ghost style={deletedLabelStyle(data?.deleted)}>
          {data?.label}
        </AutoTooltip>
        {data?.isCurrent &&
          renderTag(intl.formatMessage({ id: 'usage.user.currentAccount' }))}
        {data?.deleted && <DeletedTag id={data?.value} />}
      </span>
    );
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
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              onChange([dates[0], dates[1]]);
            }
          }}
        />
        {canManageUsers && (
          <SimpleSelect
            allowClear
            showSearch
            mode="multiple"
            maxTagCount={'responsive'}
            options={userOptions}
            placeholder={intl.formatMessage({ id: 'usage.filter.user' })}
            styles={{
              wrapper: { flex: 1, maxWidth: 240, minWidth: 150 }
            }}
            value={selectedUsers}
            optionLabelRender={userOptionRender}
            onChange={onUsersChange}
          />
        )}
        {resourceFilter && (
          <SimpleSelect
            allowClear
            showSearch
            mode="multiple"
            maxTagCount={'responsive'}
            options={resourceFilter.options}
            placeholder={resourceFilter.placeholder}
            styles={{
              wrapper: { flex: 1, maxWidth: 280, minWidth: 160 }
            }}
            value={resourceFilter.value}
            optionLabelRender={userOptionRender}
            onChange={resourceFilter.onChange}
          />
        )}
        {extra}
        {/* Enterprise-only Organization / User Group filters (platform-wide
            "All" view). Renders nothing when no plugin is registered or the
            backend returned no options. */}
        <PluginExtraFields
          name="ResourceUsageFilterBar"
          context={{
            organizationOptions: organizationOptions || [],
            userGroupOptions: userGroupOptions || [],
            selectedOrganizations: selectedOrganizations || [],
            selectedUserGroups: selectedUserGroups || [],
            onOrganizationsChange,
            onUserGroupsChange,
            optionLabelRender: userOptionRender
          }}
        />
        {onRefresh && (
          <Button
            type="text"
            style={{ color: 'var(--ant-color-text-tertiary)' }}
            onClick={onRefresh}
            icon={<SyncOutlined />}
          />
        )}
      </div>
      {(onExportChart || onExportTable) && (
        <Dropdown menu={{ items: exportMenuItems }}>
          <Button icon={<DownloadOutlined />} />
        </Dropdown>
      )}
    </div>
  );
};

export default ResourceFilterBar;
