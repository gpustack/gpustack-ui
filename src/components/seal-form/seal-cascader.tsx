import { isNotEmptyValue } from '@/utils/index';
import { useIntl } from '@umijs/max';
import type { CascaderAutoProps } from 'antd';
import { Cascader, Form } from 'antd';
import { cloneDeep } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealCascader: React.FC<CascaderAutoProps & SealFormItemProps> = (
  props
) => {
  const {
    label,
    placeholder,
    children,
    required,
    description,
    options,
    allowNull,
    isInFormItems = true,
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
    if (isNotEmptyValue(props.value) || (allowNull && props.value === null)) {
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
    props.onChange?.(val, options);
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
    <Wrapper
      status={status}
      label={label}
      isFocus={isFocus}
      required={required}
      description={description}
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Cascader
        {...rest}
        ref={inputRef}
        options={children ? null : _options}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={handleChange}
        notFoundContent={null}
      ></Cascader>
    </Wrapper>
  );
};

export default SealCascader;
