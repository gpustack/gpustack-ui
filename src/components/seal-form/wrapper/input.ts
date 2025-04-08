import styled from 'styled-components';
import {
  BGCOLOR,
  BORDERRADIUS,
  INPUTHEIGHT,
  INPUT_INNER_PADDING,
  WRAPHEIGHT
} from '../config';

const InputWrapper = styled.div`
  .seal-input-number {
    padding-right: 0;
    .isfoucs-has-value {
      top: 9px;
    }
  }
  .seal-input-wrapper-disabled {
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
  .ant-input-number-input-wrap {
    flex: 1;
  }
  .ant-input,
  .ant-input-password {
    flex: 1;
    display: flex;
    align-items: center;
    border: none;
    box-shadow: none;
    padding-block: 5px;
    padding-inline: ${INPUT_INNER_PADDING}px;
    height: ${INPUTHEIGHT}px !important;
    background-color: ${BGCOLOR};
  }
  .ant-input.seal-textarea {
    flex: 1;
  }

  .ant-input-number {
    position: static;
    display: flex;
    align-items: center;
    border: none;
    box-shadow: none;
    padding: 0;
    height: ${INPUTHEIGHT}px !important;
    background-color: ${BGCOLOR};

    &:hover .ant-input-number-handler-wrap,
    &-focused .ant-input-number-handler-wrap {
      width: 34px !important;
    }

    &:hover {
      cursor: text;
    }
    &.ant-input-number-disabled {
      &:hover {
        background-color: inherit;
      }
    }
  }
  .ant-input-outlined {
    display: flex;
    align-items: center;
    border: none;
    box-shadow: none;
    padding-block: 5px;
    padding-inline: ${INPUT_INNER_PADDING}px;
    height: ${INPUTHEIGHT}px !important;
    background-color: transparent;
  }
  .ant-input.ant-input-disabled {
    background-color: transparent;
  }
  input.ant-input-number-input {
    flex: 1;
    height: ${INPUTHEIGHT}px !important;
    padding-block: 6px 4px;
    padding-inline: ${INPUT_INNER_PADDING}px;
  }
  .ant-input-group {
    position: static;
  }
  .ant-input-group-addon {
    inset-inline-start: unset !important;
    border-radius: 0 ${BORDERRADIUS}px ${BORDERRADIUS}px 0;
    width: 30px;
    background-color: transparent;
    border: none;
    &:hover {
      background-color: transparent !important;
    }
  }
  .ant-input-group-wrapper-disabled {
    .ant-input-group-addon {
      background-color: transparent;
    }
    .ant-input-group-addon:hover {
      background-color: transparent !important;
    }
  }
  .ant-input-search-button {
    position: absolute;
    top: -20px;
    right: 1px;
    border-radius: 0 ${BORDERRADIUS}px ${BORDERRADIUS}px 0 !important;
    overflow: hidden;
    border: none;
    height: 52px;
    border-left: var(--ant-line-width) var(--ant-line-type)
      var(--ant-color-border);
  }
  .ant-input-number-handler-wrap {
    top: 0;
    height: ${WRAPHEIGHT - 2}px;
  }
  .seal-textarea-wrapper {
    height: auto;
    padding-bottom: 10px;
    padding-right: 10px;
  }
`;

export default InputWrapper;
