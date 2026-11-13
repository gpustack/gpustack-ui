import { QuestionCircleOutlined, ScanOutlined } from '@ant-design/icons';
import { BaseSelect, Select as SealSelect } from '@gpustack/core-ui';
import { Space } from 'antd';
import type { ComponentProps, ReactNode } from 'react';
import {
  categoryOptions,
  categoryOptionsWithOther,
  modelCategories
} from '../llmodels/config/categories';
import styles from './category-select.module.less';
import { categoryConfig } from './model-tag';

type CategoryOption = {
  value?: string | number | null;
  label?: ReactNode;
};

const renderCategoryOption = (
  option: CategoryOption,
  emptyOption?: 'auto' | 'other'
) => {
  const config = categoryConfig[option.value ?? ''];

  return (
    <Space size="small">
      <span aria-hidden="true" className={styles.icon}>
        {config?.icon ||
          (option.value == null && emptyOption === 'auto' ? (
            <ScanOutlined />
          ) : (
            <QuestionCircleOutlined />
          ))}
      </span>
      <span>{option.label}</span>
    </Space>
  );
};

// FilterBar owns its Select; give it the same renderers as CategorySelect.
const renderDefaultCategoryOption = (option: CategoryOption) =>
  renderCategoryOption(option);

export const categorySelectRenderProps = {
  optionRender: renderDefaultCategoryOption,
  labelRender: renderDefaultCategoryOption
};

type CategorySelectProps = Omit<
  ComponentProps<typeof SealSelect>,
  'options'
> & {
  control?: 'form' | 'filter';
  emptyOption?: 'auto' | 'other';
  categoryValues?: string[];
};

const CategorySelect = ({
  control = 'form',
  emptyOption,
  categoryValues,
  ...props
}: CategorySelectProps) => {
  const options =
    emptyOption === 'auto'
      ? modelCategories
      : emptyOption === 'other'
        ? categoryOptionsWithOther
        : categoryOptions;
  const Select = control === 'filter' ? BaseSelect : SealSelect;
  const renderOption = (option: CategoryOption) =>
    renderCategoryOption(option, emptyOption);

  return (
    <Select
      options={
        categoryValues
          ? options.filter(
              (option) =>
                option.value != null && categoryValues.includes(option.value)
            )
          : options
      }
      optionRender={renderOption}
      labelRender={renderOption}
      {...props}
    />
  );
};

export default CategorySelect;
