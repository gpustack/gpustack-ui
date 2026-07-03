import { QuestionCircleOutlined } from '@ant-design/icons';
import { LabelInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, InputNumber, Tooltip } from 'antd';
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
  maxCount?: number;
  tips?: string;
  // Explicit preset tick values (e.g. [10,20,...,100] for percentage slicing).
  // Overrides the default 1..maxCount sequence.
  presetValues?: number[];
  // Force the free-input box to show regardless of max/maxCount.
  alwaysShowInput?: boolean;
  onChange?: (value: number) => void;
}

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
  maxCount = 8,
  tips,
  presetValues,
  alwaysShowInput,
  style,
  onChange
}) => {
  const intl = useIntl();

  const showCustomInput = alwaysShowInput || max > maxCount;
  const presetItems =
    presetValues ??
    Array.from({ length: Math.max(0, maxCount) }, (_, i) => i + 1);
  if (!presetValues && min <= 0) {
    presetItems.unshift(0);
  }
  const items = presetItems;
  const isItemDisabled = (num: number) => !!disabled || num > max || num < min;
  const [inputValue, setInputValue] = useState<number | null>(() =>
    value !== undefined && value !== null && !presetItems.includes(value)
      ? value
      : null
  );

  useEffect(() => {
    if (value === undefined || value === null) {
      setInputValue(null);
    } else if (presetItems.includes(value)) {
      setInputValue(null);
    } else {
      setInputValue(value);
    }
  }, [value]);

  const handleSelect = (num: number) => {
    if (isItemDisabled(num) || num === value) {
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
            const itemDisabled = isItemDisabled(num);
            return (
              <div key={num} style={{ flex: 1 }}>
                <Tooltip title={num === 0 ? tips : false}>
                  <div
                    key={num}
                    role="radio"
                    aria-checked={num === value}
                    aria-disabled={itemDisabled}
                    tabIndex={itemDisabled ? -1 : 0}
                    className={classNames(styles.numberItem, {
                      [styles.active]: num === value && value != null,
                      [styles.itemDisabled]: itemDisabled && !disabled
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
                    {num === 0 && (
                      <QuestionCircleOutlined
                        style={{
                          marginLeft: 4,
                          fontSize: 11,
                          color: 'var(--ant-color-text-tertiary)'
                        }}
                      />
                    )}
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
        {showCustomInput && (
          <div className={styles.inputWrapper}>
            <div className={styles.line}></div>
            <div
              className={classNames(styles.inputContainer, {
                [styles.hasValue]: inputValue != null
              })}
            >
              <InputNumber
                controls={false}
                variant="borderless"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                value={inputValue ?? undefined}
                style={{
                  fontSize: 14,
                  width: 60,
                  height: 32,
                  backgroundColor: 'var(--ant-color-bg-container)',
                  ...style
                }}
                styles={{
                  input: {
                    fontWeight: inputValue != null ? 500 : 400,
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
