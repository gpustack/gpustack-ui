import { Flex, InputNumber, Slider } from 'antd';
import { createStyles } from 'antd-style';
import { useId } from 'react';

const useStyles = createStyles(({ css }) => ({
  label: css`
    color: var(--ant-color-text-secondary);
    font-size: var(--ant-font-size-sm);
  `
}));

interface WeightSliderProps {
  id?: string;
  label: string;
  value?: number;
  onChange?: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const WeightSlider = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step
}: WeightSliderProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const labelId = `${inputId}-label`;
  const { styles } = useStyles();

  return (
    <Flex vertical gap="var(--ant-padding-xxs)" style={{ minWidth: 0 }}>
      <Flex align="center" justify="space-between" gap="small">
        <label id={labelId} htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <InputNumber<number>
          id={inputId}
          size="small"
          value={value}
          min={min}
          max={max}
          step={step}
          precision={step === 1 ? 0 : undefined}
          onChange={(nextValue) => onChange?.(nextValue ?? 0)}
          style={{
            width: 80,
            flex: 'none',
            borderRadius: 'var(--ant-border-radius)'
          }}
        />
      </Flex>
      <Slider
        ariaLabelledByForHandle={labelId}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        tooltip={{ open: false }}
        style={{ marginBlock: 0, marginInline: 'var(--ant-margin-xxs)' }}
      />
    </Flex>
  );
};

export default WeightSlider;
