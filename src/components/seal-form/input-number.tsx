import type { InputNumberProps } from 'antd';
import { Form, InputNumber } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealInputNumber: React.FC<InputNumberProps & SealFormItemProps> = (
  props
) => {
  const { label, placeholder, ...rest } = props;
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);
  const { status } = Form.Item.useStatus();

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
    if (!inputRef.current?.value) {
      setIsFocus(false);
      props.onBlur?.(e);
    }
  };

  const handleInput = (e: any) => {
    props.onInput?.(e);
  };

  return (
    <Wrapper
      status={status}
      label={label || (placeholder as string)}
      isFocus={isFocus}
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <InputNumber
        {...rest}
        ref={inputRef}
        autoComplete="off"
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onInput={handleInput}
        onChange={handleChange}
      ></InputNumber>
    </Wrapper>
  );
};

export default SealInputNumber;
