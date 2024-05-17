import type { InputProps } from 'antd';
import { Form, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input/TextArea';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import SealInputNumber from './input-number';
import SealInputSearch from './input-search';
import SealPassword from './password';
import { SealFormItemProps } from './types';

const SealTextArea: React.FC<TextAreaProps & SealFormItemProps> = (props) => {
  const { label, placeholder, style, ...rest } = props;
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
      className="seal-textarea-wrapper"
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Input.TextArea
        {...rest}
        ref={inputRef}
        style={{ minHeight: '80px', ...style }}
        className="seal-textarea"
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onInput={handleInput}
        onChange={(e) => handleChange(e)}
      ></Input.TextArea>
    </Wrapper>
  );
};

const SealInput: React.FC<InputProps & SealFormItemProps> = (props) => {
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
      disabled={props.disabled}
      onClick={handleClickWrapper}
    >
      <Input
        {...rest}
        ref={inputRef}
        onInput={handleInput}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={(e) => handleChange(e)}
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
