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

  // ============= input initial =============
  .ant-input-outlined.ant-input-status-error:not(.ant-input-disabled) {
    border: none;
    box-shadow: none;
  }

  .ant-input-outlined.ant-input-status-error:not(.ant-input-disabled):focus,
  .ant-input-outlined.ant-input-status-error:not(
      .ant-input-disabled
    ):focus-within {
    border: none;
    box-shadow: none;
  }

  .ant-input-number-outlined.ant-input-number-status-error:not(
      .ant-input-number-disabled
    ) {
    border: none;
    box-shadow: none;
  }

  .ant-input-number-outlined.ant-input-number-status-error:not(
      .ant-input-number-disabled
    ):focus,
  .ant-input-number-outlined.ant-input-number-status-error:not(
      .ant-input-disabled
    ):focus-within {
    border: none;
    box-shadow: none;
  }
  // ============= input initial end =============

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
    background-color: ${BGCOLOR};
  }
  .ant-input.seal-textarea {
    flex: 1;
    overflow-y: auto !important;
  }

  .ant-input-number {
    flex: 1;
    position: static;
    display: flex;
    align-items: center;
    border: none;
    box-shadow: none;
    padding: 0;
    background-color: ${BGCOLOR};
    flex: 1;

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
    background-color: transparent;
  }
  .ant-input.ant-input-disabled {
    background-color: transparent;
  }
  input.ant-input-number-input {
    flex: 1;
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

  &:not(.textarea-input-wrapper) {
    .ant-input,
    .ant-input-password,
    .ant-input-number,
    .ant-input-outlined,
    input.ant-input-number-input {
      height: ${INPUTHEIGHT}px !important;
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
  .ant-input-number-actions {
    border-radius: 0 ${BORDERRADIUS}px ${BORDERRADIUS}px 0;
  }
  .seal-textarea-wrapper {
    height: auto;
    padding-right: 10px;
    textarea {
      overflow-y: auto !important;
    }
  }
  .ant-input-textarea-allow-clear.ant-input-affix-wrapper {
    padding: 0;
  }
`;

export default InputWrapper;
