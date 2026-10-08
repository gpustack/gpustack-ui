import { SearchOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { Input } from 'antd';
import FilterOptionGroup from './filter-option-group';
import type { FilterRenderContext, ResponsiveFilterConfig } from './types';

const FilterControl = <Values extends object>({
  filter,
  context
}: {
  filter: ResponsiveFilterConfig<Values>;
  context: FilterRenderContext<Values>;
}) => {
  const { value, onChange, onOpenChange } = context;

  switch (filter.type) {
    case 'input':
      return (
        <Input
          allowClear
          prefix={
            <SearchOutlined
              style={{ color: 'var(--ant-color-text-placeholder)' }}
            />
          }
          {...filter.inputProps}
          aria-label={filter.label}
          placeholder={filter.placeholder ?? filter.label}
          disabled={filter.disabled}
          style={{ ...filter.inputProps?.style, width: '100%' }}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'select':
      return (
        <BaseSelect
          allowClear
          {...filter.selectProps}
          aria-label={filter.label}
          placeholder={filter.placeholder ?? filter.label}
          disabled={filter.disabled}
          style={{ ...filter.selectProps?.style, width: '100%' }}
          value={value}
          options={filter.options}
          onChange={onChange}
          onOpenChange={(open) => {
            onOpenChange(open);
            filter.selectProps?.onOpenChange?.(open);
          }}
        />
      );
    case 'options':
      return (
        <FilterOptionGroup
          label={filter.label}
          options={
            filter.disabled
              ? filter.options.map((option) => ({ ...option, disabled: true }))
              : filter.options
          }
          value={
            typeof value === 'string' || typeof value === 'number'
              ? value
              : undefined
          }
          onChange={onChange}
        />
      );
    case 'custom':
      return filter.render(context);
  }
};

export default FilterControl;
