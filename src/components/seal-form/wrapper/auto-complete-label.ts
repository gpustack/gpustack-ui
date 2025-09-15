import styled from 'styled-components';
import { BGCOLOR, INPUT_INNER_PADDING } from '../config';

const AutoCompleteLabel = styled.span`
  position: absolute;
  left: ${INPUT_INNER_PADDING}px;
  height: 20px;
  line-height: 20px;
  top: 26px;
  pointer-events: none;
  transition: all 0.2s;
  background-color: var(--ant-color-bg-container);
  z-index: 10;
  &.disabled {
    background-color: #f5f5f5;
  }
  &.isfoucs-has-value {
    // display: none;
    z-index: -1;
    // top: 9px;
    // font-size: 12px;
    // color: var(--ant-color-text);
    // background-color: ${BGCOLOR};
    // padding: 0 4px;
  }
`;

export default AutoCompleteLabel;
