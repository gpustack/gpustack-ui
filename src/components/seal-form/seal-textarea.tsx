import { Form, Input } from 'antd';
import type { TextAreaProps } from 'antd/es/input/TextArea';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { SealFormItemProps } from './types';
import Wrapper from './wrapper';
import InputWrapper from './wrapper/input';

const LabelWrapper = styled.div.attrs({
  className: 'seal-textarea-label'
})`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-bottom: 2px;
  background-color: var(--ant-color-bg-container);
`;

interface InputTextareaProps extends TextAreaProps {
  scaleSize?: boolean;
  alwaysFocus?: boolean; // it's order to display the placeholder
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
    alwaysFocus,
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

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      inputRef.current?.focus?.({
        cursor: 'all'
      });
      setIsFocus(true);
    }
  };

  const handleChange = (e: any) => {
    onChange?.(e);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!inputRef.current?.resizableTextArea?.textArea?.value) {
      setIsFocus(false);
    }
    onBlur?.(e);
  };

  const handleInput = (e: any) => {
    onInput?.(e);
  };

  console.log('style=========', style, rest);

  return (
    <InputWrapper className="textarea-input-wrapper">
      <Wrapper
        status={status}
        label={label && <LabelWrapper>{label}</LabelWrapper>}
        isFocus={alwaysFocus || isFocus}
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
          placeholder={placeholder}
          spellCheck={rest.spellCheck ?? false}
          autoSize={autoSize}
          ref={inputRef}
          style={{ ...style }}
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
