import { Cascader, Input, Popover } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Panel } = Cascader;

const options = [
  {
    value: 'fruit',
    label: 'Fruit',
    children: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' }
    ]
  },
  {
    value: 'vegetable',
    label: 'Vegetable',
    children: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'potato', label: 'Potato' }
    ]
  }
];

const CustomCascader: React.FC = () => {
  const [value, setValue] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const [inputWidth, setInputWidth] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  const handleCascaderChange = (selectedValues: string[]) => {
    setValue(selectedValues.join(' / '));
    setVisible(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <Popover
      overlayStyle={{ minWidth: inputWidth }}
      content={
        <div style={{ width: '100%' }}>
          <Panel
            options={options}
            onChange={handleCascaderChange}
            changeOnSelect
          />
        </div>
      }
      arrow={false}
      placement="bottomLeft"
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
    >
      <Input
        ref={inputRef}
        placeholder="Select or type..."
        value={value}
        onChange={handleInputChange}
        onClick={() => setVisible(true)}
      />
    </Popover>
  );
};

export default CustomCascader;
