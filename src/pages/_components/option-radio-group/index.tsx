import { LabelInfo } from '@gpustack/core-ui';
import type { RadioGroupProps } from 'antd';
import { Col, ConfigProvider, Flex, Radio, Row, Tooltip, theme } from 'antd';
import classNames from 'classnames';
import { useId, type AriaAttributes, type ReactNode } from 'react';
import styles from './index.module.less';

export interface OptionRadioGroupOption<T extends string | number = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  tooltip?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

export interface OptionRadioGroupProps<T extends string | number = string>
  extends
    Pick<
      RadioGroupProps,
      'id' | 'name' | 'disabled' | 'className' | 'style' | 'onBlur' | 'onFocus'
    >,
    AriaAttributes {
  label?: ReactNode;
  required?: boolean;
  description?: ReactNode;
  value?: T;
  onChange?: (value: T) => void;
  options: OptionRadioGroupOption<T>[];
  columns?: 1 | 2 | 3 | 4 | 6;
}

/** Equal-width option buttons with neutral selection styling. */
export default function OptionRadioGroup<T extends string | number = string>({
  label,
  required,
  description,
  value,
  onChange,
  options,
  columns = 3,
  className,
  ...rest
}: OptionRadioGroupProps<T>) {
  const { token } = theme.useToken();
  const labelId = useId();
  const ariaLabel =
    rest['aria-label'] ?? (typeof label === 'string' ? label : undefined);
  return (
    <ConfigProvider wave={{ disabled: true }}>
      <Radio.Group
        {...rest}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={
          rest['aria-labelledby'] ??
          (label != null && !ariaLabel ? labelId : undefined)
        }
        aria-required={rest['aria-required'] ?? required}
        value={value}
        onChange={(event) => onChange?.(event.target.value as T)}
        className={classNames(styles.group, className)}
      >
        <Flex vertical gap={token.marginSM}>
          {label != null && (
            <div id={labelId} className={styles.label}>
              <LabelInfo
                label={label}
                required={required}
                description={description}
              />
            </div>
          )}
          <Row gutter={[token.marginXS, token.marginXS]}>
            {options.map((option) => {
              const button = (
                <Radio.Button
                  value={option.value}
                  disabled={rest.disabled || option.disabled}
                  className={styles.option}
                >
                  <Flex
                    component="span"
                    align="center"
                    justify="center"
                    gap="small"
                  >
                    {option.icon != null && (
                      <span aria-hidden className={styles.icon}>
                        {option.icon}
                      </span>
                    )}
                    <span>{option.label}</span>
                  </Flex>
                </Radio.Button>
              );
              return (
                <Col
                  key={option.value}
                  span={option.fullWidth ? 24 : 24 / columns}
                >
                  {option.tooltip != null ? (
                    <Tooltip title={option.tooltip}>{button}</Tooltip>
                  ) : (
                    button
                  )}
                </Col>
              );
            })}
          </Row>
        </Flex>
      </Radio.Group>
    </ConfigProvider>
  );
}
