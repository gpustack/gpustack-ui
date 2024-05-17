import type { InputProps } from 'antd';
import { Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const TextArea: React.FC<InputProps & SealFormItemProps> = (props) => {
  console.log('textarea=========', 121);
  return (
    <Wrapper label="input">
      <Input.TextArea
        placeholder="send your message"
        autoSize={{ minRows: 1, maxRows: 6 }}
        size="large"
        variant="borderless"
      ></Input.TextArea>
    </Wrapper>
  );
};

const SealInput: React.FC<InputProps & SealFormItemProps> = (props) => {
  const { label, placeholder, ...rest } = props;
  const [isFocus, setIsFocus] = useState(false);
  const inputRef = useRef<any>(null);

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

  return (
    <Wrapper
      label={label || (placeholder as string)}
      isFocus={isFocus}
      onClick={handleClickWrapper}
    >
      <Input
        {...rest}
        ref={inputRef}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={(e) => handleChange(e)}
      ></Input>
    </Wrapper>
  );
};

export default { TextArea, Input: SealInput };
