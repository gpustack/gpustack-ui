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
    addAfter,
    trim = true,
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
    e.target.value = e.target.value?.trim?.();
    if (!inputRef.current?.input?.value) {
      setIsFocus(false);
    }
    props.onChange?.(e);
    props.onBlur?.(e);
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
      addAfter={addAfter}
      onClick={handleClickWrapper}
    >
      <Input
        {...rest}
        placeholder={isFocus ? placeholder : ''}
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
