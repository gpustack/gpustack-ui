import { useIntl } from '@umijs/max';
import type { SelectProps } from 'antd';
import { Checkbox, Select, Tag } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import React from 'react';
import styled from 'styled-components';
import AutoTooltip from '../auto-tooltip';

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropdownWrapper = styled.div`
  .ant-select-item {
    padding-inline-start: 8px;
    &:hover {
      background-color: var(--ant-select-option-active-bg);
    }
  }
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: unset;
    font-weight: unset;
    &:hover {
      background-color: var(--ant-select-option-active-bg);
    }
  }
`;

const SelectAllWrapper = styled.div`
  margin-bottom: 10px;
  padding: 5px 8px;
  font-size: 12px;
  border-bottom: 1px solid var(--ant-color-split);
  .ant-checkbox-wrapper {
    color: var(--ant-color-text-tertiary);
  }
`;

const TagWrapper = styled(Tag)`
  border-radius: 12px;
`;

const SimpleSelect: React.FC<SelectProps> = (props) => {
  const intl = useIntl();
  const { options, ...restProps } = props;

  const [allSelection, setAllSelection] = React.useState<{
    checked: boolean;
    indeterminate: boolean;
  }>({
    checked: false,
    indeterminate: false
  });

  const optionRender = (option: any, info: any) => {
    const { value, label } = option;
    return (
      <OptionWrapper>
        {restProps.value?.includes(value) ? (
          <Checkbox checked></Checkbox>
        ) : (
          <Checkbox></Checkbox>
        )}
        <AutoTooltip ghost>{label}</AutoTooltip>
      </OptionWrapper>
    );
  };

  const handleOnCheckboxChange = (e: CheckboxChangeEvent) => {
    const isChecked = e.target.checked;
    const allValues = options?.map((opt: any) => opt.value) || [];
    setAllSelection({
      checked: isChecked,
      indeterminate: false
    });

    restProps.onChange?.(isChecked ? allValues : [], options || []);
  };

  const dropdownRender = (originPanel: React.ReactNode) => {
    return (
      <DropdownWrapper>
        {restProps.mode === 'multiple' && (
          <SelectAllWrapper>
            <Checkbox
              checked={allSelection.checked}
              indeterminate={allSelection.indeterminate}
              onChange={handleOnCheckboxChange}
            >
              {intl.formatMessage({ id: 'common.checbox.all' })}
            </Checkbox>
          </SelectAllWrapper>
        )}
        {originPanel}
      </DropdownWrapper>
    );
  };

  const handleOnChange = (value: any, option: any) => {
    const selectedValues = Array.isArray(value) ? value : [value];
    const allSelected = options?.map((opt: any) => opt.value) || [];
    const isAllSelected = selectedValues.length === allSelected?.length;

    setAllSelection({
      checked: isAllSelected,
      indeterminate: !isAllSelected && selectedValues.length > 0
    });

    restProps.onChange?.(selectedValues, option);
  };

  const TagRender = (props: any) => {
    const { label } = props;
    const count = props.isMaxTag ? label.slice(0, -3).slice(1) : label;

    return (
      <TagWrapper
        bordered={false}
        style={{
          height: 24,
          backgroundColor: 'var(--ant-color-fill-tertiary)',
          fontSize: 'var(--ant-font-size)'
        }}
        className="flex-center"
      >
        {intl.formatMessage({ id: 'common.select.count' }, { count: count })}
      </TagWrapper>
    );
  };

  return (
    <Select
      {...restProps}
      options={options}
      maxTagCount={0}
      dropdownRender={dropdownRender}
      optionRender={optionRender}
      menuItemSelectedIcon={false}
      onChange={handleOnChange}
      tagRender={TagRender}
    ></Select>
  );
};

export default SimpleSelect;
