import { AutoComplete, Form, Spin } from 'antd';
import type { AutoCompleteProps } from 'antd/lib';
import React, { useEffect, useRef, useState } from 'react';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import SelectWrapper from './wrapper/select';

const SealAutoComplete: React.FC<
  AutoCompleteProps & SealFormItemProps & { onInput?: (e: Event) => void }
> = (props) => {
  const {
    label,
    placeholder,
    required,
    description,
    isInFormItems = true,
    trim = true,
    onSelect,
    onBlur,
    extra,
    style,
    addAfter,
    loading,
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

  const handleChange = (val: string, option: any) => {
    let value = val;
    if (trim) {
      value = value?.trim?.();
    }
    props.onChange?.(value, option);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!props.value) {
      setIsFocus(false);
    }
    e.target.value = e.target.value?.trim?.();
    props.onBlur?.(e);
  };

  const handleSearch = (text: string) => {
    props.onSearch?.(text);
  };

  const handleOnSelect = (value: any, option: any) => {
    onSelect?.(value, option);
  };
  const renderAfter = () => {
    if (loading) {
      return <Spin size="small"></Spin>;
    }
    return addAfter;
  };

  return (
    <SelectWrapper>
      <Wrapper
        className="seal-select-wrapper"
        status={status}
        extra={extra}
        label={label}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        addAfter={renderAfter()}
        onClick={handleClickWrapper}
      >
        <AutoComplete
          {...rest}
          ref={inputRef}
          placeholder={
            isFocus || !label ? (
              <span style={{ paddingLeft: '12px' }}>{placeholder}</span>
            ) : (
              ''
            )
          }
          onSelect={handleOnSelect}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onSearch={handleSearch}
          onChange={handleChange}
        ></AutoComplete>
      </Wrapper>
    </SelectWrapper>
  );
};

export default SealAutoComplete;
