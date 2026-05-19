import { LabelInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, InputNumber } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './styles.less';

interface NumberSelectionProps {
  id?: string;
  step?: number;
  min?: number;
  max?: number;
  value?: number;
  disabled?: boolean;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  styles?: {
    input?: React.CSSProperties;
  };
  labelExtra?: React.ReactNode;
  onChange?: (value: number) => void;
}

const PRESET_ITEMS = [1, 2, 4, 8];

const NumberSelection: React.FC<NumberSelectionProps> = ({
  id,
  step = 1,
  min = 1,
  max = 16,
  value,
  disabled,
  label,
  required,
  labelExtra,
  className,
  style,
  onChange
}) => {
  const intl = useIntl();
  const showCustomInput = max > 8;
  const computedItems = showCustomInput
    ? PRESET_ITEMS.filter((n) => n >= min && n <= max)
    : Array.from(
        { length: Math.max(0, Math.floor((max - min) / step) + 1) },
        (_, i) => min + i * step
      );
  const items = computedItems.length === 0 ? [0] : computedItems;

  const [inputValue, setInputValue] = useState<number | null>(() =>
    value !== undefined && value !== null && !PRESET_ITEMS.includes(value)
      ? value
      : null
  );

  useEffect(() => {
    if (value === undefined || value === null) {
      setInputValue(null);
    } else if (PRESET_ITEMS.includes(value)) {
      setInputValue(null);
    } else {
      setInputValue(value);
    }
  }, [value]);

  const handleSelect = (num: number) => {
    if (disabled || num === value) {
      return;
    }
    setInputValue(null);
    onChange?.(num);
  };

  const handleInputChange = (num: number | null) => {
    setInputValue(num);
  };

  const commitInput = () => {
    if (disabled || inputValue === null || inputValue === value) {
      return;
    }
    onChange?.(inputValue);
  };
  console.log('value+++', value, 'inputValue', items, inputValue);
  return (
    <div
      id={id}
      className={classNames(styles.wrapper, className, {
        [styles.disabled]: disabled
      })}
      style={style}
      role="radiogroup"
    >
      {label !== undefined && label !== null && (
        <div className={styles.label}>
          <LabelInfo
            label={label}
            required={required}
            labelExtra={labelExtra}
          ></LabelInfo>
        </div>
      )}
      <Flex className={styles.contentWrapper} align="center">
        <div className={styles.content}>
          {items.map((num) => {
            return (
              <div
                key={num}
                role="radio"
                aria-checked={num === value}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                className={classNames(styles.numberItem, {
                  [styles.active]: num === value
                })}
                onClick={() => handleSelect(num)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(num);
                  }
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
        {showCustomInput && (
          <div className={styles.inputWrapper}>
            <div className={styles.line}></div>
            <div
              className={classNames(styles.inputContainer, {
                [styles.hasValue]: !!inputValue
              })}
            >
              <InputNumber
                controls
                variant="borderless"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                value={inputValue || undefined}
                style={{
                  fontSize: 14,
                  width: 140,
                  height: 32,
                  backgroundColor: 'var(--ant-color-bg-container)',
                  ...style
                }}
                styles={{
                  input: {
                    fontWeight: inputValue ? 500 : 400,
                    ...(styles?.input as React.CSSProperties)
                  }
                }}
                placeholder={intl.formatMessage({ id: 'common.option.other' })}
                onChange={handleInputChange}
                onBlur={commitInput}
                onPressEnter={commitInput}
              />
            </div>
          </div>
        )}
      </Flex>
    </div>
  );
};

export default NumberSelection;
