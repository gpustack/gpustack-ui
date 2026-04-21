import { useIntl } from '@umijs/max';
import { DatePickerProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

interface RangePickerPreset {
  range: number;
  presetRanges?: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[];
  disabledDate?: boolean;
}

type DateType = 'date' | 'week' | 'month' | 'quarter' | 'year';

export default function useRangePickerPreset(options?: RangePickerPreset): {
  disabledRangeDaysDate: DatePickerProps['disabledDate'];
  rangePresets: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[];
  normalizeRangeValue: (
    startDate: string,
    endDate: string,
    picker: DateType
  ) => [Dayjs, Dayjs];
  handleOnPickerChange: (value: DateType) => void;
  picker: DateType;
  range: number;
} {
  const { range = 60, disabledDate, presetRanges } = options || {};
  const intl = useIntl();
  const [picker, setPicker] = useState<DateType>('date');

  const getYearMonth = (date: Dayjs) => date.year() * 12 + date.month();

  const normalizeRangeValue = (
    startDate: string,
    endDate: string,
    picker: 'date' | 'week' | 'month' | 'quarter' | 'year'
  ): [Dayjs, Dayjs] => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    switch (picker) {
      case 'week':
        return [start.startOf('week'), end.endOf('week')];

      case 'month':
        return [start.startOf('month'), end.endOf('month')];

      case 'year':
        return [start.startOf('year'), end.endOf('year')];

      default:
        return [start, end];
    }
  };

  const getRangeBoundary = (
    from: Dayjs,
    range: number,
    type: 'date' | 'week' | 'month' | 'quarter' | 'year'
  ) => {
    switch (type) {
      case 'year':
        return {
          minDate: from.add(1 - range, 'year'),
          maxDate: from.add(range - 1, 'year')
        };

      case 'month':
        return {
          minDate: from.add(1 - range, 'month'),
          maxDate: from.add(range - 1, 'month')
        };

      case 'week':
        return {
          minDate: from.add(1 - range, 'week'),
          maxDate: from.add(range - 1, 'week')
        };

      default:
        return {
          minDate: from.add(1 - range, 'day'),
          maxDate: from.add(range - 1, 'day')
        };
    }
  };

  const disabledRangeDaysDate: DatePickerProps['disabledDate'] = (
    current,
    { from, type }
  ) => {
    if (!disabledDate || !from) {
      return false;
    }

    const { minDate, maxDate } = getRangeBoundary(from, range, type as any);

    if (from) {
      switch (type) {
        case 'year':
          return (
            current.year() < minDate.year() || current.year() > maxDate.year()
          );

        case 'month':
          return (
            getYearMonth(current) < getYearMonth(minDate) ||
            getYearMonth(current) > getYearMonth(maxDate)
          );

        case 'week': {
          const currentWeekStart = current.startOf('week');
          const currentWeekEnd = current.endOf('week');

          return (
            currentWeekEnd.isBefore(minDate, 'day') ||
            currentWeekStart.isAfter(maxDate, 'day')
          );
        }

        default:
          return current.isBefore(minDate) || current.isAfter(maxDate);
      }
    }
    return false;
  };

  const handleOnPickerChange = (value: DateType) => {
    setPicker(value);
  };

  const rangePresets: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[] = presetRanges || [
    {
      label: intl.formatMessage({ id: 'dashboard.usage.datePicker.last7days' }),
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
    }
  ];

  return {
    disabledRangeDaysDate,
    handleOnPickerChange,
    normalizeRangeValue,
    rangePresets,
    picker,
    range
  };
}
