import ResponsiveFilters, {
  type ResponsiveFilterConfig
} from '@/components/responsive-filters';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Select } from 'antd';
import { loadTypeOptions, targetModeOptions } from '../config';
import type { BenchmarkFilterValues } from '../config/types';
import useBenchmarkFilters from '../hooks/use-benchmark-filters';

export interface LeftActionsProps {
  handleSearch: () => void;
  handleQueryChange: (value: any, option?: any) => void;
  filters: Partial<BenchmarkFilterValues>;
}

const LeftActions: React.FC<LeftActionsProps> = ({
  handleSearch,
  handleQueryChange,
  filters
}) => {
  const intl = useIntl();
  const { values, changeValues, nameSearch, setNameSearch } =
    useBenchmarkFilters({
      initialValues: filters,
      onChange: handleQueryChange
    });
  const searchIcon = (
    <SearchOutlined style={{ color: 'var(--ant-color-text-placeholder)' }} />
  );

  const textFilters = [
    {
      key: 'model_name' as const,
      placeholder: 'benchmark.table.filter.bymodel'
    },
    {
      key: 'profile' as const,
      placeholder: 'benchmark.table.filter.byProfile'
    },
    {
      key: 'gpu_summary' as const,
      placeholder: 'benchmark.table.filter.bygpu'
    }
  ];

  const filterConfigs: ResponsiveFilterConfig<BenchmarkFilterValues>[] = [
    {
      key: 'search',
      type: 'custom',
      label: intl.formatMessage({ id: 'common.filter.name' }),
      width: 200,
      clearValue: '',
      render: ({ value, onChange, onOpenChange }) => (
        // Keep the original tags Select: names are sent comma-separated to
        // match any of them, and this field has no predefined options.
        <Select
          mode="tags"
          allowClear
          notFoundContent={null}
          tokenSeparators={[',', ' ']}
          maxTagCount="responsive"
          suffixIcon={searchIcon}
          placeholder={intl.formatMessage({ id: 'common.filter.name' })}
          aria-label={intl.formatMessage({ id: 'common.filter.name' })}
          style={{ width: '100%' }}
          value={typeof value === 'string' && value ? value.split(',') : []}
          searchValue={nameSearch}
          onSearch={setNameSearch}
          onOpenChange={onOpenChange}
          onChange={(names: string[]) => onChange(names.join(','))}
        />
      )
    },
    ...textFilters.map(({ key, placeholder }) => ({
      key,
      type: 'input' as const,
      label: intl.formatMessage({ id: placeholder }),
      placeholder: intl.formatMessage({ id: placeholder }),
      width: 160
    })),
    {
      key: 'target_mode',
      type: 'select',
      placement: 'popover',
      label: intl.formatMessage({ id: 'benchmark.form.targetMode' }),
      placeholder: intl.formatMessage({
        id: 'benchmark.table.filter.byTargetMode'
      }),
      options: targetModeOptions.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.label })
      }))
    },
    {
      key: 'load_type',
      type: 'select',
      placement: 'popover',
      label: intl.formatMessage({ id: 'benchmark.form.loadType' }),
      placeholder: intl.formatMessage({
        id: 'benchmark.table.filter.byLoadType'
      }),
      options: loadTypeOptions.map((option) => ({
        value: option.value,
        label: intl.formatMessage({ id: option.label })
      }))
    }
  ];

  return (
    <ResponsiveFilters
      filters={filterConfigs}
      values={values}
      onChange={(patch, info) =>
        changeValues(
          patch,
          info.reason === 'change' && info.filter.type === 'input'
        )
      }
      suffix={
        <Button
          type="text"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          aria-label={intl.formatMessage({ id: 'common.button.refresh' })}
          onClick={handleSearch}
          icon={<SyncOutlined />}
        />
      }
    />
  );
};

export default LeftActions;
