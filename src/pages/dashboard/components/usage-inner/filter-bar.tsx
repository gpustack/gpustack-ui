import AutoTooltip from '@/components/auto-tooltip';
import SealCascader from '@/components/seal-form/seal-cascader';
import SimpleSelect from '@/components/seal-form/simple-select';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { DownloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { DASHBOARD_STATS_API } from '../../apis';
import useRangePickerPreset from '../../hooks/use-rangepicker-preset';

const OptionWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DefaultDateConfig = {
  maxRange: 60,
  defaultRange: 29
};

const FilterWrapper = styled.div`
  poisiton: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
  .selection {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ant-select-selection-overflow-item > span {
    height: 24px;
  }
`;

interface FilterBarProps {
  query: any;
  userList: any[];
  modelList: any[];
  handleDateChange: (dates: any, dateStrings: [string, string]) => void;
  handleUsersChange: (value: any) => void;
  handleModelsChange: (value: any) => void;
  handleExport?: () => void;
  selectedModels: string[][];
  url: string;
  disabledDate?: boolean;
  cascaderWidth?: number;
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    query,
    userList,
    modelList,
    selectedModels,
    cascaderWidth = 300,
    handleDateChange,
    handleUsersChange,
    handleModelsChange,
    handleExport,
    url,
    disabledDate
  } = props;
  const { disabledRangeDaysDate, rangePresets } = useRangePickerPreset({
    range: DefaultDateConfig.maxRange,
    disabledDate: disabledDate
  });

  const intl = useIntl();

  const displayRender = (labels: any[], option: any) => {
    return (
      <AutoTooltip
        ghost
        maxWidth={150}
        title={
          <span>
            {labels[0]} / {labels[1]}
          </span>
        }
      >
        {labels[0]} / {labels[1]}
      </AutoTooltip>
    );
  };

  const optionRender = (option: any) => {
    const { data } = option;

    if (!data.isParent) {
      return <AutoTooltip ghost>{data.label}</AutoTooltip>;
    }

    if (data.providerType === 'deployments') {
      return (
        <OptionWrapper>
          <ProviderLogo provider={data.providerType as string} />
          <AutoTooltip ghost maxWidth={105}>
            {intl.formatMessage({ id: 'menu.models.deployment' })}
          </AutoTooltip>
        </OptionWrapper>
      );
    }

    return (
      <OptionWrapper>
        <ProviderLogo provider={data.providerType as string} />
        <AutoTooltip ghost maxWidth={105}>
          <span>{data.label}</span>
        </AutoTooltip>
      </OptionWrapper>
    );
  };

  return (
    <FilterWrapper>
      <div className="selection">
        <DatePicker.RangePicker
          maxDate={dayjs()}
          defaultValue={[
            dayjs().add(-DefaultDateConfig.defaultRange, 'd'),
            dayjs()
          ]}
          disabledDate={disabledRangeDaysDate}
          presets={rangePresets}
          allowClear={false}
          style={{ width: 220 }}
          value={[dayjs(query.start_date), dayjs(query.end_date)]}
          onChange={handleDateChange}
        ></DatePicker.RangePicker>
        <SimpleSelect
          allowClear
          showSearch
          mode="multiple"
          options={userList}
          maxTagCount={0}
          placeholder={intl.formatMessage({
            id: 'dashboard.usage.selectuser'
          })}
          style={{ maxWidth: 200, minWidth: 160 }}
          value={query.user_ids}
          onChange={handleUsersChange}
        ></SimpleSelect>
        <SealCascader
          showSearch
          multiple={true}
          onChange={handleModelsChange}
          classNames={{
            popup: {
              root: 'cascader-popup-wrapper gpu-selector'
            }
          }}
          styles={{
            root: {
              width: cascaderWidth
            },
            popup: {
              listItem: {
                padding: '5px 10px'
              }
            }
          }}
          maxTagCount={1}
          size="small"
          placeholder={intl.formatMessage({
            id: 'dashboard.usage.selectmodel'
          })}
          options={modelList}
          value={selectedModels}
          showCheckedStrategy="SHOW_CHILD"
          displayRender={displayRender}
          optionNode={optionRender}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
        ></SealCascader>
        {url === DASHBOARD_STATS_API && (
          <Tooltip title={intl.formatMessage({ id: 'common.button.export' })}>
            <Button icon={<DownloadOutlined />} onClick={handleExport}></Button>
          </Tooltip>
        )}
      </div>
    </FilterWrapper>
  );
};

export default FilterBar;
