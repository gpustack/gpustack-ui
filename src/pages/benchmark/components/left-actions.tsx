import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import { useState } from 'react';
import type { BenchmarkFilterValues, TextFilterKey } from '../config/types';
import useBenchmarkFilters from '../hooks/use-benchmark-filters';
import FilterMenu from './filter-menu';
import ResponsiveFilters, {
  type ResponsiveFilterItem
} from './responsive-filters';

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
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const searchIcon = (
    <SearchOutlined style={{ color: 'var(--ant-color-text-placeholder)' }} />
  );

  const textFilters = [
    {
      key: 'model_name' as const,
      placeholder: 'benchmark.table.filter.bymodel'
    },
    {
      key: 'gpu_summary' as const,
      placeholder: 'benchmark.table.filter.bygpu'
    },
    { key: 'profile' as const, placeholder: 'benchmark.table.filter.byProfile' }
  ];

  const items: ResponsiveFilterItem<TextFilterKey>[] = [
    {
      key: 'search',
      width: 200,
      locked: nameDropdownOpen,
      content: (
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
          value={values.search ? values.search.split(',') : []}
          searchValue={nameSearch}
          onSearch={setNameSearch}
          onOpenChange={setNameDropdownOpen}
          onChange={(names: string[]) =>
            changeValues({ search: names.join(',') })
          }
        />
      )
    },
    ...textFilters.map(({ key, placeholder }) => ({
      key,
      width: 160,
      content: (
        <Input
          prefix={searchIcon}
          placeholder={intl.formatMessage({ id: placeholder })}
          aria-label={intl.formatMessage({ id: placeholder })}
          style={{ width: '100%' }}
          value={values[key]}
          allowClear
          onChange={(event) =>
            changeValues({ [key]: event.target.value }, true)
          }
        />
      )
    }))
  ];

  return (
    <ResponsiveFilters
      items={items}
      renderOverflow={(overflowItems) => (
        <FilterMenu
          values={values}
          onChange={changeValues}
          overflowItems={overflowItems}
        />
      )}
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
