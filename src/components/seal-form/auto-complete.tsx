import { LoadingOutlined } from '@ant-design/icons';
import { AutoComplete, Form, Typography } from 'antd';
import type { AutoCompleteProps } from 'antd/lib';
import React, { useEffect, useRef, useState } from 'react';
import { LoadingContent } from './components/not-found-content';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import SelectWrapper from './wrapper/select';

const Link = Typography.Link;

const SealAutoComplete: React.FC<
  AutoCompleteProps &
    SealFormItemProps & {
      onInput?: (e: Event) => void;
      clearSpaceOnBlur?: boolean;
    }
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
    checkStatus,
    extra,
    style,
    addAfter,
    suffixIcon,
    loading,
    allowClear,
    clearSpaceOnBlur,
    showSearch,
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
    console.log('handleChange val:', val);
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

    if (clearSpaceOnBlur) {
      e.target.value = e.target.value?.replace(/\s+/g, '');
      props.onChange?.(e.target.value);
    } else {
      e.target.value = e.target.value?.trim();
    }
    props.onBlur?.(e);
  };

  const handleOnSelect = (value: any, option: any) => {
    onSelect?.(value, option);
  };

  const handleOnInput = (e: any) => {
    if (trim) {
      e.target.value = e.target.value?.trim();
    }
    props.onInput?.(e);
  };

  const renderAfter = () => {
    if (loading) {
      return (
        <Link>
          <LoadingOutlined />
        </Link>
      );
    }
    return suffixIcon || null;
  };

  const popupRender = (originNode: React.ReactElement): React.ReactElement => {
    if (loading) {
      return <LoadingContent />;
    }
    return originNode || null;
  };

  return (
    <SelectWrapper style={style}>
      <Wrapper
        className="seal-select-wrapper"
        status={checkStatus || status}
        extra={extra}
        label={label}
        isFocus={isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
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
          allowClear={!loading && allowClear}
          suffixIcon={renderAfter()}
          // @ts-ignore
          status={checkStatus || status}
          onSelect={handleOnSelect}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          showSearch={showSearch}
          onChange={handleChange}
          popupRender={popupRender}
          onInput={handleOnInput}
        ></AutoComplete>
      </Wrapper>
    </SelectWrapper>
  );
};

export default SealAutoComplete;
