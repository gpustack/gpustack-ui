import Wrapper from '@/components/label-selector/wrapper';
import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import FormWidget from './form-widget';

interface ListMapProps {
  dataList: any[];
  label?: React.ReactNode;
  btnText?: string;
  properties: Record<string, any>;
  onChange?: (data: any) => void;
}

interface ListItemProps {
  schemaList: any[];
  data: Record<string, any>;
  onChange?: (data: any) => void;
}

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const WidgetBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const ListItem: React.FC<ListItemProps> = ({ schemaList, data, onChange }) => {
  const handleValueChange = (name: string, target: any) => {
    if (target?.target?.type === 'checkbox') {
      const checked = target.target?.checked;
      onChange?.({ [name]: checked });
    } else {
      const value = target?.target ? target.target.value : target;
      onChange?.({ [name]: value });
    }
  };

  return (
    <>
      {schemaList.map((schema: any) => (
        <FormWidget
          widget={schema.type}
          {...schema}
          key={schema.name}
          value={data?.[schema.name]}
          checked={data?.[schema.name]}
          onChange={(target) => handleValueChange(schema.name, target)}
        />
      ))}
    </>
  );
};

const ListMap: React.FC<ListMapProps> = ({
  dataList = [],
  label,
  btnText,
  properties = {},
  onChange
}) => {
  const [items, setItems] = React.useState(dataList || []);

  const schemaList = useMemo(() => {
    const list = Object.entries(properties).map(([key, value]) => ({
      ...value,
      name: key
    }));
    return list;
  }, [properties]);

  const handleOnAdd = () => {
    const keys = Object.keys(properties);
    setItems([
      ...items,
      { ...keys.reduce((acc, key) => ({ ...acc, [key]: '' }), {}) }
    ]);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange?.(newItems);
  };

  const handleItemChange = (index: number, data: { [key: string]: any }) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
    onChange?.(newItems);
  };

  useEffect(() => {
    if (!dataList.length) {
      handleOnAdd();
    }
  }, []);

  return (
    <Wrapper label={label} btnText={btnText} onAdd={handleOnAdd}>
      {items.map((item, index) => (
        <RowWrapper key={index}>
          <WidgetBox>
            <ListItem
              schemaList={schemaList}
              data={item}
              onChange={(value) => handleItemChange(index, value)}
            />
          </WidgetBox>
          <Button
            size="small"
            type="default"
            shape="circle"
            style={{
              width: 24,
              marginLeft: 10,
              flex: 'none'
            }}
            icon={<MinusOutlined />}
            onClick={() => handleDelete(index)}
          />
        </RowWrapper>
      ))}
    </Wrapper>
  );
};

export default ListMap;
