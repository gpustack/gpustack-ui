import { Form, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input/TextArea';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import InputWrapper from './wrapper/input';

const LabelWrapper = styled.div`
  background-color: var(--ant-color-bg-container);
`;

interface InputTextareaProps extends TextAreaProps {
  scaleSize?: boolean;
}

const SealTextArea: React.FC<InputTextareaProps & SealFormItemProps> = (
  props
) => {
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
    scaleSize,
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

  const autoSize = useMemo(() => {
    const focusRows = props.autoSize || { minRows: 2, maxRows: 5 };

    if (scaleSize) {
      return isFocus ? focusRows : { minRows: 1, maxRows: 1 };
    }

    return focusRows;
  }, [props.autoSize, isFocus, scaleSize]);

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
    [onBlur, scaleSize]
  );

  const handleInput = useCallback(
    (e: any) => {
      onInput?.(e);
    },
    [onInput]
  );

  return (
    <InputWrapper>
      <Wrapper
        status={status}
        label={<LabelWrapper>{label}</LabelWrapper>}
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
          autoSize={autoSize}
          ref={inputRef}
          style={{ minHeight: '80px', ...style }}
          className="seal-textarea"
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onInput={handleInput}
          onChange={(e) => handleChange(e)}
        ></Input.TextArea>
      </Wrapper>
    </InputWrapper>
  );
};

export default SealTextArea;
