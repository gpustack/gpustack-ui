import type { InputProps } from 'antd';
import { Form, Input } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import SealInputNumber from './input-number';
import SealInputSearch from './input-search';
import SealPassword from './password';
import SealTextArea from './seal-textarea';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import InputWrapper from './wrapper/input';

const SealInput: React.FC<InputProps & SealFormItemProps> = (props) => {
  const {
    label,
    placeholder,
    required,
    description,
    isInFormItems = true,
    variant,
    addAfter,
    checkStatus,
    trim = true,
    loading,
    labelExtra,
    style,
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
    if (props.value) {
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
    if (trim) {
      e.target.value = e.target.value?.trim?.();
    }
    props.onChange?.(e);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!inputRef.current?.input?.value) {
      setIsFocus(false);
    }
    if (!trim) {
      e.target.value = e.target.value?.trim?.();
      props.onChange?.(e);
    }
    props.onBlur?.(e);
  };

  const handleInput = (e: any) => {
    props.onInput?.(e);
  };

  return (
    <InputWrapper style={style}>
      <Wrapper
        status={checkStatus || status}
        label={label}
        labelExtra={labelExtra}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        addAfter={addAfter}
        hasPrefix={!!props.prefix}
        onClick={handleClickWrapper}
      >
        <Input
          {...rest}
          placeholder={isFocus || !label ? placeholder : ''}
          ref={inputRef}
          autoComplete="off"
          onInput={handleInput}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onChange={handleChange}
        ></Input>
      </Wrapper>
    </InputWrapper>
  );
};

export default {
  TextArea: SealTextArea,
  Input: SealInput,
  Password: SealPassword,
  Number: SealInputNumber,
  Search: SealInputSearch
} as Record<
  string,
  React.FC<InputProps & SealFormItemProps & { scaleSize?: boolean }>
>;
