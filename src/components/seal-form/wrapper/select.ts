import styled from 'styled-components';
import { BORDERRADIUS, INPUT_INNER_PADDING, INPUTHEIGHT } from '../config';

const SelectWrapper = styled.div`
  .seal-select-wrapper {
    border: none;
    box-shadow: none;

    &.dropdown-visible {
      .__wrapper__ {
        .ant-select-selector {
          border-bottom: none !important;
          border-radius: ${BORDERRADIUS}px ${BORDERRADIUS}px 0 0;
          transition: all 0.2s ease;

          &::before {
            content: '';
            position: absolute;
            height: 1px;
            margin-inline: 1px;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: var(--ant-color-split);
          }
        }

        .ant-select-dropdown {
          box-shadow: none;
          border-width: var(--ant-line-width);
          border-style: var(--ant-line-type);
          border-color: var(--ant-input-active-border-color);
          border-top: none;
        }

        &:hover {
          .ant-select-dropdown {
            border-color: var(--ant-input-active-border-color);
          }
        }

        &:focus-within {
          border-color: var(--ant-input-active-border-color) !important;
          outline: 0;
          background-color: var(--ant-input-active-bg);
        }
      }
    }

    &:focus-within {
      border: none;
      box-shadow: none;
    }
    .__wrapper__ {
      padding-block: 0;

      .label {
        left: ${INPUT_INNER_PADDING + 1}px !important;
        top: 11px;

        &.isfoucs-has-value {
          top: 11px;
          transition: all 0.2s var(--seal-transition-func);
        }

        &.blur-no-value {
          top: 21px;
          transition: all 0.2s var(--seal-transition-func);
        }

        &.has-prefix {
          top: 11px !important;
        }
      }
      &.no-label {
        padding-block: 0;

        .ant-select-arrow {
          top: 50%;
        }

        .ant-select-selector {
          padding-block-start: 0 !important;
        }

        .ant-select .ant-select-selection-search {
          top: 10px !important;
        }
      }
    }
    .ant-select-selection-overflow-item > span {
      display: flex;
      align-items: center;
    }
    .ant-select {
      display: flex;
      align-items: center;
      height: 54px;

      .ant-select-selection-wrap {
        height: 100%;
      }

      &.ant-select-auto-complete {
        .ant-select-selection-search {
          padding-inline-start: ${INPUT_INNER_PADDING}px;
        }
      }
      &.ant-select-multiple.ant-cascader .ant-select-selection-search {
        top: 0 !important;
      }
    }

    .ant-select-selector {
      flex: 1;
      padding-inline: ${INPUT_INNER_PADDING}px !important;
      border-width: var(--ant-line-width);
      border-style: var(--ant-line-type);
      border-color: var(--ant-color-border);
      border-radius: ${BORDERRADIUS}px;
      height: 54px !important;
      padding-block: 20px 0 !important;
      box-shadow: none !important;

      &:focus-within {
        border-color: var(--ant-input-active-border-color) !important;
        outline: 0;
        background-color: var(--ant-input-active-bg);
      }
    }

    .ant-select-multiple.ant-select-lg {
      .ant-select-selection-search {
        margin-inline-start: 0 !important;
        left: 0 !important;
      }
    }

    .ant-select-selection-item {
      height: ${INPUTHEIGHT}px !important;
      padding-block: 5px !important;
      line-height: 22px !important;
      padding-inline-end: 0 !important;
    }

    .ant-select-auto-complete .ant-select-selector {
      padding-inline: 0 !important;
      flex: 1;
    }

    .ant-select-arrow {
      top: 32px;
    }

    .ant-select-outlined.ant-select-disabled:not(.ant-select-customize-input)
      .ant-select-selector {
      background-color: transparent;
    }

    .ant-select-selection-search-input {
      height: ${INPUTHEIGHT}px !important;
    }

    &.validate-status-error {
      .ant-select-selector {
        border-width: var(--ant-line-width) !important;
        border-style: var(--ant-line-type) !important;
        border-color: var(--ant-color-error) !important;

        &:hover {
          border-color: var(--ant-color-error-border-hover) !important;
        }

        &:focus-within {
          border-color: var(--ant-color-error) !important;
        }
      }

      &.dropdown-visible {
        .ant-select-dropdown {
          border-color: var(--ant-color-error) !important;
        }
      }
    }
  }
`;

export default SelectWrapper;
