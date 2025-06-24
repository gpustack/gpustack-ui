import { useIntl } from '@umijs/max';
import { DatePickerProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

interface RangePickerPreset {
  range: number;
}

export default function useRangePickerPreset(options?: RangePickerPreset): {
  disabledRangeDaysDate: DatePickerProps['disabledDate'];
  rangePresets: {
    label: React.ReactNode;
    value: [Dayjs, Dayjs] | (() => [Dayjs, Dayjs]);
  }[];
  range: number;
} {
  const { range = 60 } = options || {};
  const intl = useIntl();

  const getYearMonth = (date: Dayjs) => date.year() * 12 + date.month();

  const disabledRangeDaysDate: DatePickerProps['disabledDate'] = (
    current,
    { from, type }
  ) => {
    // before 2025 is not allowed
    if (current.year() < 2025) {
      return true;
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
          return Math.abs(current.diff(from, 'days')) > range;
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
      value: [dayjs().add(-7, 'd'), dayjs()]
    },
    {
      label: intl.formatMessage({
        id: 'dashboard.usage.datePicker.last30days'
      }),
      value: [dayjs().add(-30, 'd'), dayjs()]
    },
    {
      label: intl.formatMessage({
        id: 'dashboard.usage.datePicker.last60days'
      }),
      value: [dayjs().add(-60, 'd'), dayjs()]
    }
  ];

  return {
    disabledRangeDaysDate,
    rangePresets,
    range
  };
}
