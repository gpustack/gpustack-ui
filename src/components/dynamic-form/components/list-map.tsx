import Wrapper from '@/components/label-selector/wrapper';
import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { statusType } from '../config/types';
import FormWidget from './form-widget';

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
interface ListMapProps {
  minItems?: number;
  dataList: any[];
  label?: React.ReactNode;
  btnText?: string;
  requiredFields?: string[];
  validateStatusList?: Record<string, statusType>[];
  properties: Record<string, any>;
  disabled?: boolean;
  onAdd?: (data: any[]) => void;
  onDelete?: (deletedItem: any, data: any[]) => void;
  onChange?: (data: any) => void;
}

interface ListItemProps {
  schemaList: any[];
  data: Record<string, any>;
  disabled?: boolean;
  validateStatus?: Record<string, statusType>;
  onChange?: (data: any) => void;
}

const ListItem: React.FC<ListItemProps> = ({
  schemaList,
  data,
  onChange,
  validateStatus,
  disabled
}) => {
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
          status={validateStatus?.[schema.name]}
          widget={schema.type}
          {...schema}
          disabled={disabled || schema.readOnly}
          key={schema.name}
          value={data?.[schema.name]}
          checked={data?.[schema.name]}
          isInFormItems={false}
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
  requiredFields = [],
  minItems = 0,
  validateStatusList = [],
  disabled,
  onAdd,
  onDelete,
  onChange
}) => {
  const [items, setItems] = React.useState(dataList || []);

  const schemaList = useMemo(() => {
    const list = Object.entries(properties).map(([key, value]) => ({
      ...value,
      required: requiredFields.includes(key),
      name: key
    }));
    return list;
  }, [properties, requiredFields]);

  const handleOnAdd = () => {
    const keys = Object.keys(properties);
    const newItems = [
      ...items,
      { ...keys.reduce((acc, key) => ({ ...acc, [key]: '' }), {}) }
    ];
    setItems(newItems);
    onAdd?.(newItems);
  };

  const handleDelete = (index: number) => {
    const deleteItem = items[index];
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onDelete?.(deleteItem, newItems);
  };

  const handleItemChange = (index: number, data: { [key: string]: any }) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
    onChange?.(newItems);
  };

  useEffect(() => {
    if (!dataList.length && minItems > 0) {
      handleOnAdd();
    }
  }, []);

  useEffect(() => {
    setItems(dataList);
  }, [dataList]);

  return (
    <Wrapper
      label={label}
      btnText={btnText}
      onAdd={handleOnAdd}
      disabled={disabled}
    >
      {items.map((item, index) => (
        <RowWrapper key={index}>
          <WidgetBox>
            <ListItem
              schemaList={schemaList}
              data={item}
              validateStatus={validateStatusList?.[index]}
              disabled={disabled}
              onChange={(value) => handleItemChange(index, value)}
            />
          </WidgetBox>
          {!disabled && (
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
          )}
        </RowWrapper>
      ))}
    </Wrapper>
  );
};

export default ListMap;
