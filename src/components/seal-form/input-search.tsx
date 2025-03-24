import { Form, Input } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import React, { useEffect, useRef, useState } from 'react';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import InputWrapper from './wrapper/input';

type OnSearch = (
  value: string,
  event?:
    | React.ChangeEvent<HTMLInputElement>
    | React.MouseEvent<HTMLElement>
    | React.KeyboardEvent<HTMLInputElement>,
  info?: {
    source?: 'clear' | 'input';
  }
) => void;

const SealInputSearch: React.FC<SearchProps & SealFormItemProps> = (props) => {
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
    status = statusData?.status || '';
  }

  useEffect(() => {
    if (props.value) {
      setIsFocus(true);
    }
  }, [props.value]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.();
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
    if (!inputRef.current?.input?.value) {
      setIsFocus(false);
      props.onBlur?.(e);
    }
  };

  const handleSearch: OnSearch = (...args) => {
    props.onSearch?.(...args);
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
      >
        <Input.Search
          {...rest}
          ref={inputRef}
          autoComplete="off"
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onSearch={handleSearch}
          onChange={handleChange}
        ></Input.Search>
      </Wrapper>
    </InputWrapper>
  );
};

export default SealInputSearch;
