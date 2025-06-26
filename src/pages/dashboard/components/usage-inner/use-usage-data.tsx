import useSelectRender from '@/components/seal-form/hooks/use-select-render';
import { queryModelsList } from '@/pages/llmodels/apis';
import { ListItem as ModelListItem } from '@/pages/llmodels/config/types';
import { queryUsersList } from '@/pages/users/apis';
import { DownloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Select, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  DASHBOARD_STATS_API,
  DASHBOARD_USAGE_API,
  queryDashboardUsageData
} from '../../apis';
import { baseColorMap } from '../../config';
import useRangePickerPreset from '../../hooks/use-rangepicker-preset';

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
`;

interface RequestTokenData {
  requestData: {
    name: string;
    color: string;
    areaStyle: any;
    data: { time: string; value: number }[];
  }[];
  tokenData: {
    data: { time: string; value: number }[];
  }[];
  xAxisData: string[];
}

const DefaultDateConfig = {
  maxRange: 60,
  defaultRange: 30
};

const getLast30Days = () => {
  const dates: string[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    dates.push(date);
  }

  return dates;
};

const getAllDays = (start: string, end: string) => {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const days: string[] = [];
  for (
    let d = startDate;
    d.isBefore(endDate) || d.isSame(endDate, 'day');
    d = d.add(1, 'day')
  ) {
    days.push(d.format('YYYY-MM-DD'));
  }
  return days;
};

const generateValueMap = (list: { timestamp: number; value: number }[]) => {
  return new Map(
    list.map((item) => [
      dayjs(item.timestamp * 1000).format('YYYY-MM-DD'),
      item.value
    ])
  );
};

const generateData = (dateRage: string[], valueMap: Map<string, number>) => {
  return dateRage.map((date) => {
    const value = valueMap.get(date) || 0;
    return {
      time: date,
      value: value
    };
  });
};

export default function useUseageData<T>(config: {
  url: string;
  defaultData?: T;
  disabledDate?: boolean;
}) {
  const { url, defaultData, disabledDate = false } = config || {};
  const intl = useIntl();
  const { TagRender } = useSelectRender({
    maxTagWidth: 100
  });
  const { disabledRangeDaysDate, rangePresets } = useRangePickerPreset({
    range: DefaultDateConfig.maxRange,
    disabledDate: disabledDate
  });
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{
    start_date?: string;
    end_date?: string;
    data: T;
  }>({
    start_date: dayjs()
      .subtract(DefaultDateConfig.defaultRange, 'days')
      .format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    data: defaultData as T
  });

  const [query, setQuery] = useState<{
    start_date: string;
    end_date: string;
    model_ids: number[];
    user_ids: number[];
  }>({
    start_date: dayjs()
      .subtract(DefaultDateConfig.defaultRange, 'days')
      .format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    model_ids: [],
    user_ids: []
  });

  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [userList, setUserList] = useState<Global.BaseOption<string>[]>([]);
  const [loading, setLoading] = useState(false);

  const usageData = useMemo<{
    requestTokenData: RequestTokenData;
  }>(() => {
    if (url === DASHBOARD_USAGE_API) {
      return {
        requestTokenData: {
          requestData: [],
          tokenData: [],
          xAxisData: []
        }
      };
    }
    const { start_date, end_date, data } = result as {
      start_date?: string;
      end_date?: string;
      data: {
        api_request_history: { timestamp: number; value: number }[];
        completion_token_history: { timestamp: number; value: number }[];
        prompt_token_history: { timestamp: number; value: number }[];
      };
    };

    const dateRange =
      start_date && end_date
        ? getAllDays(start_date, end_date)
        : getLast30Days();

    const completionTokenHistory = data?.completion_token_history || [];
    const promptTokenHistory = data?.prompt_token_history || [];
    const apiRequestHistory = data?.api_request_history || [];

    if (!completionTokenHistory.length) {
      return {
        requestTokenData: {
          requestData: [],
          tokenData: [],
          xAxisData: []
        }
      };
    }

    // ========== API request ==============
    const requestList: {
      name: string;
      color: string;
      areaStyle: any;
      data: { time: string; value: number }[];
    } = {
      name: 'API requests',
      areaStyle: {
        color: 'rgba(13,171,219,0.15)'
      },
      color: baseColorMap.baseR1,
      data: generateData(dateRange, generateValueMap(apiRequestHistory))
    };

    // =========== token usage data ==============
    const completionData: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: generateData(dateRange, generateValueMap(completionTokenHistory))
    };
    const promptData: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: generateData(dateRange, generateValueMap(promptTokenHistory))
    };

    return {
      requestTokenData: {
        requestData: [requestList],
        tokenData: [completionData, promptData],
        xAxisData: dateRange
      }
    };
  }, [result, url]);

  const fetchModelsList = async () => {
    try {
      const params = {
        page: 1,
        page_size: 100
      };

      const response = await queryModelsList(params);
      const list = _.map(response.items || [], (item: ModelListItem) => {
        return {
          label: item.name,
          value: item.id
        };
      });
      setModelList(list);
    } catch (error) {
      setModelList([]);
    }
  };

  const fetchUsersList = async () => {
    try {
      const params = {
        page: 1,
        page_size: 100
      };

      const response = await queryUsersList(params);
      const list = _.map(response.items || [], (item: any) => {
        return {
          label: item.username,
          value: item.id
        };
      });
      setUserList(list);
    } catch (error) {
      setUserList([]);
    }
  };

  const fetchUsageData = async (queryParams: any) => {
    try {
      setLoading(true);
      const response = await queryDashboardUsageData<T>(queryParams, {
        url: url
      });
      setResult({
        start_date: queryParams.start_date,
        end_date: queryParams.end_date,
        data: response
      });
    } catch (error) {
      setResult({
        start_date: queryParams.start_date,
        end_date: queryParams.end_date,
        data: {} as T
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any, dateString: string[]) => {
    setQuery((pre) => {
      return {
        ...pre,
        start_date: dateString[0],
        end_date: dateString[1]
      };
    });
    fetchUsageData({
      ...query,
      start_date: dateString[0],
      end_date: dateString[1]
    });
  };

  const handleOnCancel = () => {
    setOpen(false);
  };

  const handleExport = () => {
    setOpen(true);
  };

  const handleUsersChange = (value: number[]) => {
    setQuery((pre) => {
      return {
        ...pre,
        user_ids: value
      };
    });
    fetchUsageData({ ...query, user_ids: value });
  };
  const handleModelsChange = (value: number[]) => {
    setQuery((pre) => {
      return {
        ...pre,
        model_ids: value
      };
    });
    fetchUsageData({ ...query, model_ids: value });
  };

  const init = () => {
    fetchUsageData(query);
    fetchModelsList();
    fetchUsersList();
  };

  const FilterBar = () => {
    const filterOptions = (inputValue: any, option: any) => {
      return option.label?.toLowerCase().includes(inputValue.toLowerCase());
    };
    return (
      <FilterWrapper>
        <div className="selection">
          <DatePicker.RangePicker
            maxDate={dayjs()}
            defaultValue={[dayjs().add(-29, 'd'), dayjs()]}
            disabledDate={disabledRangeDaysDate}
            presets={rangePresets}
            allowClear={false}
            style={{ width: 240 }}
            value={[dayjs(query.start_date), dayjs(query.end_date)]}
            onChange={handleDateChange}
          ></DatePicker.RangePicker>
          <Select
            allowClear
            showSearch
            mode="multiple"
            options={userList}
            maxTagCount={1}
            filterOption={filterOptions}
            tagRender={TagRender}
            placeholder={intl.formatMessage({
              id: 'dashboard.usage.selectuser'
            })}
            style={{ maxWidth: 200, minWidth: 160 }}
            value={query.user_ids}
            onChange={handleUsersChange}
          ></Select>
          <Select
            allowClear
            showSearch
            mode="multiple"
            options={modelList}
            maxTagCount={1}
            tagRender={TagRender}
            filterOption={filterOptions}
            placeholder={intl.formatMessage({
              id: 'dashboard.usage.selectmodel'
            })}
            value={query.model_ids}
            style={{ maxWidth: 200, minWidth: 160 }}
            onChange={handleModelsChange}
          ></Select>
          {url === DASHBOARD_STATS_API && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.export' })}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              ></Button>
            </Tooltip>
          )}
        </div>
      </FilterWrapper>
    );
  };

  return {
    usageData,
    result,
    open,
    loading,
    userList,
    modelList,
    query,
    setQuery,
    init,
    setResult,
    FilterBar,
    handleOnCancel,
    handleExport
  };
}
