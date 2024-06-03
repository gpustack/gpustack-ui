import type { InputProps } from 'antd';
import { Form, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealPassword: React.FC<InputProps & SealFormItemProps> = (props) => {
  const { label, placeholder, required, description, ...rest } = props;
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
      inputRef.current?.focus?.({
        cursor: 'all'
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
      <Input.Password
        {...rest}
        ref={inputRef}
        autoComplete="off"
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={handleChange}
      ></Input.Password>
    </Wrapper>
  );
};

export default SealPassword;
