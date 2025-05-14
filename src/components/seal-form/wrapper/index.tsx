import { theme } from 'antd';
import classNames from 'classnames';
import React, { FC } from 'react';
import styled from 'styled-components';
import LabelInfo from '../components/label-info';
import { INPUT_INNER_PADDING } from '../config';

interface WrapperProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  noWrapperStyle?: boolean;
  isFocus?: boolean;
  classList?: string;
  status?: string; // error | success | warning
  required?: boolean;
  description?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  extra?: React.ReactNode;
  addAfter?: React.ReactNode;
  variant?: string;
  hasPrefix?: boolean;
  labelExtra?: React.ReactNode;
  onClick?: () => void;
}

// wrapper box
const WrapperBox = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 54px;
  border-width: var(--ant-line-width);
  border-style: var(--ant-line-type);
  border-color: var(--ant-color-border);
  border-radius: var(--border-radius-base);
  background-color: var(--ant-color-bg-container);
  &.borderless {
    border: none;
    box-shadow: none;
  }
  &.filled {
    border: none;
    box-shadow: none;
  }
  &.borderless:focus-within {
    border: none;
    box-shadow: none;
  }
  &:hover {
    border-color: var(--ant-input-hover-border-color);
    transition: all 0.2s ease;
  }
  &:focus-within:not(.no-focus, .borderless) {
    border-color: var(--ant-input-active-border-color);
    box-shadow: var(--ant-input-active-shadow);
    outline: 0;
    background-color: var(--ant-input-active-bg);
  }
  &.validate-status-error:not(.seal-select-wrapper) {
    border-width: var(--ant-line-width);
    border-style: var(--ant-line-type);
    border-color: var(--ant-color-error);

    &:hover {
      border-color: var(--ant-color-error-border-hover);
    }

    &:focus-within {
      border-color: var(--ant-color-error);
    }
  }
  &.seal-input-wrapper-disabled {
    background-color: var(--ant-color-bg-container-disabled);
    cursor: not-allowed;

    &:hover {
      border-color: var(--ant-color-border);

      .ant-input-search-button {
        border-color: var(--ant-color-border) !important;
        color: var(--ant-color-text-description) !important;
      }
    }
  }
`;

// wrapper
const InnerWrapper = styled.div.attrs<{
  $noWrapperStyle?: boolean;
  $nolabel?: boolean;
}>((props) => ({
  className: classNames({
    __wrapper__: true,
    'no-wrapper-style': props.$noWrapperStyle,
    'no-label': props.$nolabel
  })
}))`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  padding-block: 20px 0;
  max-width: 100%;
  &:hover {
    .ant-input-number-handler-wrap {
      width: 34px !important;
    }
  }
  &.no-wrapper-style {
    padding-block: 0;
  }
  &.no-label {
    padding-block: 0;
  }
`;

// label
export const Label = styled.div.attrs<{
  $isFocus?: boolean;
  $hasPrefix?: boolean;
}>((props) => ({
  className: classNames({
    'isfoucs-has-value': props.$isFocus,
    'blur-no-value': !props.$isFocus,
    'has-prefix': props.$hasPrefix
  })
}))`
  position: absolute;
  left: ${INPUT_INNER_PADDING}px;
  color: rgba(0, 0, 0, 45%);
  font-size: var(--font-size-base);
  line-height: 1;
  pointer-events: all;
  display: flex;
  width: max-content;
  z-index: 5;

  &.isfoucs-has-value {
    top: 10px;
    transition: all 0.2s var(--seal-transition-func);
  }

  &.blur-no-value {
    top: 20px;
    transition: all 0.2s var(--seal-transition-func);
  }

  &.has-prefix {
    top: 10px !important;
  }
`;

// inner
const Inner = styled.div`
  width: 100%;
`;

const Extra = styled.div`
  position: absolute;
  right: 12px;
  top: 8px;
  z-index: 10;
`;

const AddAfter = styled.div`
  position: relative;
  color: var(--ant-color-text-quaternary);
  font-size: var(--font-size-base);
  padding-right: calc(var(--ant-padding-sm) - 1px);
`;

// for wrapper

const Wrapper: FC<WrapperProps> = ({
  children,
  label,
  isFocus,
  status,
  className,
  disabled,
  classList,
  description,
  required,
  extra,
  variant,
  addAfter,
  hasPrefix,
  noWrapperStyle,
  labelExtra,
  onClick
}) => {
  const { token } = theme.useToken();
  const wrapperClass = classNames(
    status ? `validate-status-${status}` : '',
    className,
    classList,
    variant,
    {
      'seal-input-wrapper-addafter': addAfter,
      'seal-input-wrapper-disabled': disabled
    }
  );
  const wrapperStyle: Record<string, any> = {
    '--ant-line-width': '1px',
    '--ant-line-type': 'solid',
    '--ant-color-border': token.colorBorder,
    '--ant-color-bg-container': token.colorBgContainer,
    '--ant-color-bg-container-disabled': token.colorBgContainerDisabled,
    '--ant-color-error': token.colorError,
    '--ant-input-hover-border-color': token.colorPrimaryHover,
    '--ant-color-error-border-hover': token.colorErrorBorderHover,
    '--ant-input-active-border-color': token.colorPrimary,
    '--ant-input-active-shadow': `0 0 0 2px ${token.controlOutline}`,
    '--ant-input-active-bg': token.colorBgContainer
  };
  return (
    <WrapperBox className={wrapperClass} style={wrapperStyle}>
      <InnerWrapper
        $noWrapperStyle={noWrapperStyle}
        $nolabel={!label}
        onClick={onClick}
      >
        {label && (
          <Label $isFocus={isFocus} $hasPrefix={hasPrefix} onClick={onClick}>
            <LabelInfo
              label={label}
              required={required}
              description={description}
              labelExtra={labelExtra}
            ></LabelInfo>
          </Label>
        )}
        {extra && <Extra>{extra}</Extra>}
        <Inner>{children}</Inner>
      </InnerWrapper>
      {addAfter && <AddAfter>{addAfter}</AddAfter>}
    </WrapperBox>
  );
};

export default Wrapper;
