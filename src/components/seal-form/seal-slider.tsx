import { INPUT_WIDTH } from '@/constants';
import { Form, InputNumber, Slider, type SliderSingleProps } from 'antd';
import React from 'react';
import LabelInfo from './components/label-info';
import FieldWrapper from './field-wrapper';
import SliderStyles from './styles/slider.less';

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

  const renderLabel = React.useMemo(() => {
    return (
      <span
        className={SliderStyles['slider-label']}
        style={{ width: labelWidth || INPUT_WIDTH.mini }}
      >
        <span className="text">
          <LabelInfo label={label} description={description}></LabelInfo>
        </span>

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
  }, [label, labelWidth, description, value, max, min, step, defaultValue]);
  return (
    <FieldWrapper
      required={required}
      status={checkStatus || status}
      label={renderLabel}
      style={{ padding: '20px 2px 0' }}
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
        onChange={handleChange}
      ></Slider>
    </FieldWrapper>
  );
};

export default SealSlider;
