import { isNotEmptyValue } from '@/utils/index';
import type { InputNumberProps } from 'antd';
import { Form, InputNumber } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import InputWrapper from './wrapper/input';

const SealInputNumber: React.FC<InputNumberProps & SealFormItemProps> = (
  props
) => {
  const {
    label,
    placeholder,
    required,
    description,
    isInFormItems = true,
    ...rest
  } = props;
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);
  let status = '';
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = props.status || statusData?.status || '';
  } else {
    status = props.status || '';
  }

  useEffect(() => {
    if (isNotEmptyValue(props.value)) {
      setIsFocus(true);
    }
  }, [props.value]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.({
        cursor: 'end'
      });
      setIsFocus(true);
    }
  };

  const handleChange = (e: any) => {
    props.onChange?.(e);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!inputRef.current?.value) {
      setIsFocus(false);
      props.onBlur?.(e);
    }
  };

  const handleInput = (e: any) => {
    props.onInput?.(e);
  };

  return (
    <InputWrapper>
      <Wrapper
        status={status}
        label={label}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        onClick={handleClickWrapper}
        className="seal-input-number"
      >
        <InputNumber
          {...rest}
          placeholder={placeholder}
          ref={inputRef}
          autoComplete="off"
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onInput={handleInput}
          onChange={handleChange}
        ></InputNumber>
      </Wrapper>
    </InputWrapper>
  );
};

export default SealInputNumber;
