import { Button } from 'antd';
import React from 'react';

interface CheckButtonsProps {
  options: Global.BaseOption<string | number>[];
  onChange: (value: string | number) => void;
  cancelable?: boolean;
  size?: 'small' | 'middle' | 'large';
  type?: 'text' | 'primary' | 'default' | 'dashed' | 'link' | undefined;
}

const CheckButtons: React.FC<CheckButtonsProps> = (props) => {
  const [type, setType] = React.useState(props.type || 'text');
  const [active, setActive] = React.useState<string | number | null>(null);
  const handleChange = (value: string | number) => {
    props.onChange(value);
    if (props.cancelable && active === value) {
      setActive(null);
    } else {
      setActive(value);
    }
  };
  return (
    <div className="flex-center gap-6">
      {props.options?.map?.((option, index) => {
        return (
          <Button
            size={props.size}
            key={option.value}
            onClick={() => handleChange(option.value)}
            variant="filled"
            color={active === option.value ? 'default' : undefined}
            type={type}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default React.memo(CheckButtons);
