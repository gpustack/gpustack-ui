import { useIntl } from '@umijs/max';
import type { SelectProps } from 'antd';
import { Checkbox, Tag } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import AutoTooltip from '../auto-tooltip';
import BaseSelect from './base/select';

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

const SimpleSelect: React.FC<SelectProps & { ref?: any; showTags?: boolean }> =
  forwardRef((props, ref) => {
    const intl = useIntl();
    const { options = [], showTags, ...restProps } = props;

    const [allSelection, setAllSelection] = React.useState<{
      checked: boolean;
      indeterminate: boolean;
    }>({
      checked: false,
      indeterminate: false
    });
    const [optionsList, setOptionsList] = React.useState<any[]>(options || []);
    const selectRef = React.useRef<any>(null);
    const selectorRef = React.useRef<any>(null);

    useEffect(() => {
      setOptionsList(options || []);
    }, [options]);

    const optionRender = (option: any, info: any) => {
      const { value, label } = option;
      return (
        <OptionWrapper>
          {restProps.value?.includes?.(value) ? (
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
      const allValues = optionsList?.map((opt: any) => opt.value) || [];

      setAllSelection({
        checked: isChecked,
        indeterminate: false
      });

      let allSelectedValues = [...(restProps.value || [])];

      if (isChecked) {
        // Select all options
        allSelectedValues = Array.from(
          new Set([...allSelectedValues, ...allValues])
        );
      } else {
        // Deselect all options
        allSelectedValues = allSelectedValues.filter(
          (value) => !allValues.includes(value)
        );
      }

      restProps.onChange?.(allSelectedValues, optionsList || []);
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
                {intl.formatMessage({ id: 'common.checkbox.all' })}
              </Checkbox>
            </SelectAllWrapper>
          )}
          {originPanel}
        </DropdownWrapper>
      );
    };

    const handleOnChange = (value: any, option: any) => {
      const selectedValues = Array.isArray(value) ? value : [value];
      const allSelected = optionsList?.map((opt: any) => opt.value) || [];
      const isAllSelected = selectedValues.length === allSelected?.length;

      setAllSelection({
        checked: isAllSelected,
        indeterminate: !isAllSelected && selectedValues.length > 0
      });

      restProps.onChange?.(selectedValues, option);
    };

    const filterOption = (inputValue: string, option: any) => {
      if (!option || !option.label) return false;
      return option.label.toLowerCase().includes(inputValue.toLowerCase());
    };

    const checkAllSelection = (list: Global.BaseOption<string | number>[]) => {
      if (
        !restProps.value ||
        !Array.isArray(restProps.value) ||
        list.length === 0
      ) {
        setAllSelection({
          checked: false,
          indeterminate: false
        });
        return;
      }
      const selectedValues = new Set(restProps.value);
      const allValues = list?.map((opt: any) => opt.value) || [];

      const isAllSelected = allValues.every((val: any) =>
        selectedValues.has(val)
      );

      const isSomeSelected = allValues.some((val: any) =>
        selectedValues.has(val)
      );

      setAllSelection({
        checked: isAllSelected,
        indeterminate: isSomeSelected && !isAllSelected
      });
    };

    const TagRender = (props: any) => {
      const { label } = props;
      const count = props.isMaxTag ? label.slice(0, -3).slice(1) : label;

      return (
        <TagWrapper
          variant="filled"
          closable={props.closable}
          onClose={props.onClose}
          style={{
            height: 24,
            backgroundColor: 'var(--ant-color-fill-tertiary)',
            fontSize: 'var(--ant-font-size)'
          }}
          className="flex-center"
        >
          {showTags
            ? label
            : intl.formatMessage(
                { id: 'common.select.count' },
                { count: count }
              )}
        </TagWrapper>
      );
    };

    const handleOnSearch = (value: string) => {
      if (restProps.showSearch?.onSearch) {
        restProps.showSearch?.onSearch?.(value);
      } else {
        const filteredOptions = options?.filter((option: any) =>
          option.label.toLowerCase().includes(value.toLowerCase())
        ) as Global.BaseOption<string | number>[];
        setOptionsList(filteredOptions || []);
        checkAllSelection(filteredOptions || []);
      }
    };

    const handleOnBlur = (e: any) => {
      restProps.onBlur?.(e);
    };

    const handleOnFocus = (e: any) => {
      restProps.onFocus?.(e);
    };

    const handleOnOpenChange = (open: boolean) => {
      if (!open) {
        checkAllSelection(options as Global.BaseOption<string | number>[]);
        setOptionsList(options || []);
      }
    };

    useEffect(() => {
      const input = selectRef.current?.querySelector?.('input');

      if (!input) return;

      const handler = (event: KeyboardEvent) => {
        if (
          event.key === 'Backspace' &&
          (input as HTMLInputElement).value === ''
        ) {
          event.stopPropagation();
          event.preventDefault();
        }
      };

      input.addEventListener('keydown', handler);

      return () => {
        input.removeEventListener('keydown', handler);
      };
    }, [selectRef.current]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        selectorRef.current?.focus();
      },
      blur: () => {
        selectorRef.current?.blur();
      }
    }));

    return (
      <div ref={selectRef} style={{ width: 'inherit' }}>
        <BaseSelect
          {...restProps}
          ref={selectorRef}
          options={optionsList}
          maxTagCount={restProps.maxTagCount || 0}
          defaultActiveFirstOption={false}
          popupRender={dropdownRender}
          optionRender={optionRender}
          menuItemSelectedIcon={false}
          onChange={handleOnChange}
          tagRender={TagRender}
          onBlur={handleOnBlur}
          onFocus={handleOnFocus}
          showSearch={{
            onSearch: handleOnSearch,
            filterOption: restProps.showSearch?.filterOption || filterOption
          }}
          onOpenChange={handleOnOpenChange}
        >
          {props.children}
        </BaseSelect>
      </div>
    );
  });

export default SimpleSelect;
