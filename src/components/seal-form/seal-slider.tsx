import { INPUT_WIDTH } from '@/constants';
import { Form, InputNumber, Slider, type SliderSingleProps } from 'antd';
import React from 'react';
import LabelInfo from './components/label-info';
import Wrapper from './wrapper';
import SliderWrapper from './wrapper/slider';

interface SealSliderProps extends SliderSingleProps {
  required?: boolean;
  label?: React.ReactNode;
  labelWidth?: number | string;
  description?: string;
  isInFormItems?: boolean;
  inputnumber?: boolean;
  checkStatus?: 'success' | 'error' | 'warning' | '';
}

const SealSlider: React.FC<SealSliderProps> = (props) => {
  const {
    label,
    value,
    required,
    description,
    isInFormItems = true,
    max,
    min,
    step,
    defaultValue,
    checkStatus,
    inputnumber = false,
    labelWidth,
    tooltip = { open: false },
    ...rest
  } = props;

  let status = '';
  if (isInFormItems) {
    const statusData = Form?.Item?.useStatus?.();
    status = statusData?.status || '';
  }

  const handleChange = (value: number) => {
    props.onChange?.(value);
  };

  const handleInput = (value: number | null) => {
    const newValue = value || 0;
    props.onChange?.(newValue);
  };

  const renderLabel = () => {
    return (
      <span
        className="slider-label"
        style={{ width: labelWidth || INPUT_WIDTH.mini }}
      >
        <LabelInfo label={label} description={description}></LabelInfo>

        {inputnumber ? (
          <InputNumber
            className="label-val"
            variant="outlined"
            size="small"
            value={value}
            controls={false}
            onChange={handleInput}
          ></InputNumber>
        ) : (
          <span className="val">{value}</span>
        )}
      </span>
    );
  };
  return (
    <SliderWrapper className="slider-wrapper">
      <Wrapper
        required={required}
        status={checkStatus || status}
        label={renderLabel()}
        isFocus={true}
        variant="borderless"
      >
        <Slider
          {...rest}
          defaultValue={defaultValue}
          max={max}
          min={min}
          step={step}
          style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
          tooltip={tooltip}
          value={value}
          styles={{
            rail: {
              borderRadius: 3
            },
            track: {
              borderRadius: 3
            },
            tracks: {
              borderRadius: 3
            }
          }}
          onChange={handleChange}
        ></Slider>
      </Wrapper>
    </SliderWrapper>
  );
};

export default SealSlider;
