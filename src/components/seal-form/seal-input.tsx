import type { InputProps } from 'antd';
import { Form, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import SealInputNumber from './input-number';
import SealInputSearch from './input-search';
import SealPassword from './password';
import SealTextArea from './seal-textarea';
import { SealFormItemProps } from './types';

const SealInput: React.FC<InputProps & SealFormItemProps> = (props) => {
  const {
    label,
    placeholder,
    required,
    description,
    isInFormItems = true,
    variant,
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
    if (!inputRef.current?.input?.value) {
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
      required={required}
      description={description}
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Input
        {...rest}
        ref={inputRef}
        autoComplete="off"
        onInput={handleInput}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={handleChange}
      ></Input>
    </Wrapper>
  );
};

export default {
  TextArea: SealTextArea,
  Input: SealInput,
  Password: SealPassword,
  Number: SealInputNumber,
  Search: SealInputSearch
} as Record<string, React.FC<InputProps & SealFormItemProps>>;
