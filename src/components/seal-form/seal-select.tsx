import { isNotEmptyValue } from '@/utils/index';
import { useIntl } from '@umijs/max';
import type { SelectProps } from 'antd';
import { Form, Select } from 'antd';
import { cloneDeep } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealSelect: React.FC<SelectProps & SealFormItemProps> = (props) => {
  const {
    label,
    placeholder,
    children,
    required,
    description,
    options,
    isInFormItems = true,
    ...rest
  } = props;
  const intl = useIntl();
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);
  let status = '';
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
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
    if (isNotEmptyValue(props.value)) {
      setIsFocus(true);
    }
  }, [props.value]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.();
      setIsFocus(true);
    }
  };

  const handleChange = (val: any, options: any) => {
    if (isNotEmptyValue(val)) {
      setIsFocus(true);
    } else {
      setIsFocus(false);
    }
    props.onChange?.(val, options);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!props.value) {
      setIsFocus(false);
    }
    props.onBlur?.(e);
  };

  return (
    <Wrapper
      status={status}
      label={label}
      isFocus={isFocus}
      required={required}
      description={description}
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Select
        {...rest}
        ref={inputRef}
        options={_options}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={handleChange}
        notFoundContent={null}
      >
        {children}
      </Select>
    </Wrapper>
  );
};

export default SealSelect;
