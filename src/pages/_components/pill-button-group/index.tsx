import AutoTooltip from '@/components/auto-tooltip';
import React from 'react';
import pillButtonCss from './styles.less';

type Option = {
  label: string;
  value: string | number | null;
  icon?: React.ReactNode;
};

type Props = {
  value?: string | number;
  onChange?: (value: string | number | undefined | null) => void;
  options: Option[];
  disabled?: boolean;
  variant?: 'filled' | 'outlined' | 'solid';
};

const PillButtonGroup: React.FC<Props> = ({
  value,
  onChange,
  options,
  disabled,
  variant = 'outlined'
}) => {
  return (
    <div className={pillButtonCss['wrapper']}>
      {options.map((item) => {
        const active = value === item.value;

        return (
          <AutoTooltip
            ghost
            title={item.label}
            key={item.value}
            maxWidth={'100%'}
          >
            <span
              className={`${pillButtonCss['pill-item']} ${active ? pillButtonCss['active'] : ''}`}
              key={item.value}
              color="default"
              onClick={() => {
                if (item.value !== value) {
                  onChange?.(item.value);
                }
                if (item.value === value) {
                  onChange?.(undefined);
                }
              }}
            >
              {item.icon}
              {item.label}
            </span>
          </AutoTooltip>
        );
      })}
    </div>
  );
};

export default PillButtonGroup;
