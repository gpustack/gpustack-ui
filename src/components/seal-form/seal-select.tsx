import { isNotEmptyValue } from '@/utils/index';
import { useIntl } from '@umijs/max';
import type { SelectProps } from 'antd';
import { Form } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import BaseSelect from './base/select';
import NotFoundContent from './components/not-found-content';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import SelectWrapper from './wrapper/select';

const SealSelect: React.FC<
  SelectProps & SealFormItemProps & { footer?: React.ReactNode }
> = (props) => {
  const {
    label,
    placeholder,
    children,
    required,
    description,
    options,
    allowNull,
    isInFormItems = true,
    notFoundContent = null,
    loading,
    footer,
    ...rest
  } = props;
  const intl = useIntl();
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);

  let status = '';

  // the status can be controlled by Form.Item
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
  } else {
    status = props.status || '';
  }

  const _options = useMemo(() => {
    if (!options?.length) {
      return [];
    }
    const list = cloneDeep(options);
    return list.map((item: any) => {
      if (item.locale) {
        item.label = intl.formatMessage({ id: item.label as string });
      }
      return item;
    });
  }, [options, intl]);

  useEffect(() => {
    if (
      isNotEmptyValue(props.value) ||
      (allowNull && (props.value === null || props.value === undefined))
    ) {
      setIsFocus(true);
    }
  }, [props.value, allowNull]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.();
      setIsFocus(true);
    }
  };

  const handleChange = (val: any, options: any) => {
    if (isNotEmptyValue(val) || (allowNull && val === null)) {
      setIsFocus(true);
    } else {
      setIsFocus(false);
    }
    props.onChange?.(val || null, options);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (allowNull && props.value === null) {
      setIsFocus(true);
    } else if (!props.value) {
      setIsFocus(false);
    }
    props.onBlur?.(e);
  };

  return (
    <SelectWrapper>
      <Wrapper
        className="seal-select-wrapper"
        status={status}
        label={label}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        onClick={handleClickWrapper}
      >
        <BaseSelect
          {...rest}
          footer={footer}
          ref={inputRef}
          options={children ? null : _options}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onChange={handleChange}
          notFoundContent={
            <NotFoundContent
              loading={loading}
              notFoundContent={notFoundContent}
            />
          }
        >
          {children}
        </BaseSelect>
      </Wrapper>
    </SelectWrapper>
  );
};

export default SealSelect;
