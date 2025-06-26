import { useIntl } from '@umijs/max';
import { DatePickerProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

interface RangePickerPreset {
  range: number;
  disabledDate?: boolean;
}

export default function useRangePickerPreset(options?: RangePickerPreset): {
  disabledRangeDaysDate: DatePickerProps['disabledDate'];
  rangePresets: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[];
  range: number;
} {
  const { range = 60, disabledDate } = options || {};
  const intl = useIntl();

  const getYearMonth = (date: Dayjs) => date.year() * 12 + date.month();

  const disabledRangeDaysDate: DatePickerProps['disabledDate'] = (
    current,
    { from, type }
  ) => {
    if (!disabledDate) {
      return false;
    }

    if (from) {
      const minDate = from.add(1 - range, 'days');
      const maxDate = from.add(range - 1, 'days');

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

        default:
          return current.isBefore(minDate) || current.isAfter(maxDate);
      }
    }
    return false;
  };

  const rangePresets: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[] = [
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
    rangePresets,
    range
  };
}
