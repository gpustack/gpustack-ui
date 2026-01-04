import styled from 'styled-components';
import { INPUTHEIGHT, INPUT_INNER_PADDING } from '../config';

const SliderWrapper = styled.div`
  .__wrapper__ {
    height: 100%;
    justify-content: center;
  }
  .label-wrapper {
    width: 100%;
  }

  .borderless {
    background-color: transparent;
  }
  .ant-slider {
    flex: 1;
  }
  padding-block: 0;
  padding-inline: 2px;
  input.ant-input-number-input {
    text-align: center !important;
    flex: 1;
    height: ${INPUTHEIGHT}px !important;
    padding-block: 5px;
    padding-inline: ${INPUT_INNER_PADDING}px;
  }
  .isfoucs-has-value {
    left: 0;
  }
  .slider-label {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;

    .val {
      color: var(--ant-color-text);
    }

    .label-val {
      position: absolute !important;
      top: -14px;
      right: 0px;
      width: 80px;
      border-radius: var(--border-radius-base);
      text-align: center;
      border: 1px solid var(--ant-color-border) !important;

      .ant-input-number-input {
        text-align: center !important;
      }
    }
  }
`;

export default SliderWrapper;
