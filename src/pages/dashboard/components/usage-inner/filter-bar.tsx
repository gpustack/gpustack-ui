import SimpleSelect from '@/components/seal-form/simple-select';
import { DownloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { DASHBOARD_STATS_API } from '../../apis';
import useRangePickerPreset from '../../hooks/use-rangepicker-preset';

const DefaultDateConfig = {
  maxRange: 60,
  defaultRange: 29
};

const FilterWrapper = styled.div`
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
  url: string;
  disabledDate?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    query,
    userList,
    modelList,
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
        <SimpleSelect
          allowClear
          showSearch
          mode="multiple"
          options={modelList}
          maxTagCount={0}
          placeholder={intl.formatMessage({
            id: 'dashboard.usage.selectmodel'
          })}
          value={query.model_ids}
          style={{ maxWidth: 200, minWidth: 160 }}
          onChange={handleModelsChange}
        ></SimpleSelect>
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
