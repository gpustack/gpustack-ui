import { Form, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input/TextArea';
import { useCallback, useEffect, useRef, useState } from 'react';
import Wrapper from './components/wrapper';
import { SealFormItemProps } from './types';

const SealTextArea: React.FC<TextAreaProps & SealFormItemProps> = (props) => {
  const {
    label,
    placeholder,
    onChange,
    onFocus,
    onBlur,
    onInput,
    style,
    required,
    isInFormItems = true,
    description,
    variant,
    extra,
    addAfter,
    trim,
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

  const handleClickWrapper = useCallback(() => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.({
        cursor: 'all'
      });
      setIsFocus(true);
    }
  }, [props.disabled, isFocus]);

  const handleChange = useCallback(
    (e: any) => {
      onChange?.(e);
    },
    [onChange]
  );

  const handleOnFocus = useCallback(
    (e: any) => {
      setIsFocus(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleOnBlur = useCallback(
    (e: any) => {
      if (!inputRef.current?.resizableTextArea?.textArea?.value) {
        setIsFocus(false);
        onBlur?.(e);
      }
    },
    [onBlur]
  );

  const handleInput = useCallback(
    (e: any) => {
      onInput?.(e);
    },
    [onInput]
  );

  return (
    <Wrapper
      status={status}
      label={label}
      isFocus={isFocus}
      required={required}
      description={description}
      className="seal-textarea-wrapper"
      extra={extra}
      disabled={props.disabled}
      addAfter={addAfter}
      onClick={handleClickWrapper}
    >
      <Input.TextArea
        {...rest}
        autoSize={rest.autoSize || { minRows: 2, maxRows: 5 }}
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

export default SealTextArea;
