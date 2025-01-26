import React from 'react';
import DropdownOption from './option';

type optionType = string | number;
interface DropdownPanelProps {
  onChange: (value: string | number, item?: any) => void;
  options: Global.BaseOption<optionType>[];
  renderLabel?: (item: any) => React.ReactNode;
}

const DropdownPanel: React.FC<DropdownPanelProps> = (props) => {
  const { options, renderLabel, onChange } = props;
  const [selected, setSelected] = React.useState<string | number>('');

  const handleSelect = (value: string | number, item: any) => {
    setSelected(value);
    onChange(value, item);
  };

  return (
    <div className="dropdown-panel">
      {options.map((item) => (
        <div key={item.value}>
          <DropdownOption
            onClick={() => handleSelect(item.value, item)}
            selected={item.value === selected}
            label={renderLabel ? renderLabel(item) : item.label}
          ></DropdownOption>
        </div>
      ))}
    </div>
  );
};

export default React.memo(DropdownPanel);
