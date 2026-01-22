import { MinusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';
import Wrapper from '../label-selector/wrapper';

const ItemContainer = styled.div`
  display: flex;
  margin-bottom: 12px;
  align-items: center;
  justify-content: flex-start;

  .seprator {
    display: flex;
    flex: none;
    width: 12px;
    align-items: center;
    justify-content: center;
    color: var(--ant-color-text-tertiary);
  }

  .btn {
    width: 24px;
    margin-left: 10px;
    flex: none;
  }
`;

interface MetadataListProps {
  dataList: any[];
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  btnText?: string;
  styles?: {
    wrapper?: React.CSSProperties;
  };
  onAdd?: () => void;
  onDelete?: (index: number, item: any) => void;
  children?: (item: any, index: number) => React.ReactNode;
}

const MetadataList: React.FC<MetadataListProps> = ({
  dataList,
  label,
  description,
  disabled,
  btnText,
  children,
  onDelete,
  onAdd,
  styles
}) => {
  return (
    <Wrapper
      styles={styles}
      label={label}
      description={description}
      onAdd={onAdd}
      disabled={disabled}
      btnText={btnText}
    >
      {dataList.map((item, index) => (
        <ItemContainer key={index}>
          {children?.(item, index)}
          {!disabled && (
            <Button
              size="small"
              className="btn"
              type="default"
              shape="circle"
              onClick={() => onDelete?.(index, item)}
            >
              <MinusOutlined />
            </Button>
          )}
        </ItemContainer>
      ))}
    </Wrapper>
  );
};

export default MetadataList;
