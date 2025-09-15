import { AutoComplete, Form, Spin } from 'antd';
import type { AutoCompleteProps } from 'antd/lib';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import AutoCompleteLabel from './wrapper/auto-complete-label';
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
  const [_isFocus_, _setIsFocus_] = useState(false);
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
      _setIsFocus_(true);
    }
  };

  const handleChange = (val: string, option: any) => {
    let value = val;
    if (trim) {
      value = value?.trim?.();
    }
    _setIsFocus_(false);
    props.onChange?.(value, option);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    _setIsFocus_(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!props.value) {
      setIsFocus(false);
      _setIsFocus_(false);
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

  const renderAutoCompleteLabel = () => {
    console.log(
      'renderAutoCompleteLabel===',
      props.value,
      props.showSearch,
      _isFocus_,
      isFocus
    );
    if (!props.showSearch || _isFocus_) {
      return null;
    }
    let selectItem: {
      label: React.ReactNode;
      value: string | number;
    } = props.options?.find((item: any) => item.value === props.value) as {
      label: React.ReactNode;
      value: string | number;
    };

    if (!selectItem) {
      selectItem = { label: props.value, value: props.value };
    }
    return (
      <AutoCompleteLabel
        className={classNames({
          disabled: props.disabled
        })}
      >
        {props.labelRender ? props.labelRender(selectItem) : selectItem.label}
      </AutoCompleteLabel>
    );
  };

  return (
    <SelectWrapper style={style}>
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
