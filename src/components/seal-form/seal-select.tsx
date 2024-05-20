import { isNotEmptyValue } from '@/utils/index';
import type { SelectProps } from 'antd';
import { Form, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealSelect: React.FC<SelectProps & SealFormItemProps> = (props) => {
  const { label, placeholder, children, ...rest } = props;
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);
  const { status } = Form.Item.useStatus();

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
    setIsFocus(false);
    props.onBlur?.(e);
  };

  const handleOnSearch = (val: any) => {
    props.onSearch?.(val);
  };

  return (
    <Wrapper
      status={status}
      label={label || (placeholder as string)}
      isFocus={isFocus}
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Select
        {...rest}
        ref={inputRef}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onSearch={handleOnSearch}
        onChange={handleChange}
        notFoundContent={null}
      >
        {children}
      </Select>
    </Wrapper>
  );
};

export default SealSelect;
