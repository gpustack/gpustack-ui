import Wrapper from '@/components/label-selector/wrapper';
import { DeleteOutlined } from '@ant-design/icons';
import { useHover } from 'ahooks';
import { Button, Divider, Flex, Input, Popover } from 'antd';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

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
  onAdd
}) => {
  return (
    <Wrapper
      label={label}
      description={description}
      onAdd={onAdd}
      disabled={disabled}
      btnText={btnText}
      styles={{
        wrapper: {
          padding: 0,
          border: 'none'
        }
      }}
    >
      {dataList.map((item, index) => (
        <ItemContainer key={index}>{children?.(item, index)}</ItemContainer>
      ))}
    </Wrapper>
  );
};

const DeleteWrapper = styled.span`
  cursor: pointer;
  color: var(--ant-color-text-tertiary);
  &:hover {
    color: var(--ant-color-error-text-hover);
  }
`;

const Box = styled.div`
  width: 100%;
  .ant-input-suffix {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  &:hover {
    .ant-input-suffix {
      opacity: 1;
      transition: opacity 0.2s ease-in-out;
    }
  }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid var(--ant-color-border);
  border-radius: 4px;
  padding: 8.5px 11px;
  height: 40px;
  width: 240px;
  cursor: pointer;
  &:hover {
    border-color: var(--ant-color-primary-hover);
  }
  &:active {
    box-shadow: var(--ant-input-active-shadow);
  }
  .holder {
    color: var(--ant-color-text-placeholder);
  }
`;
const CompareConditions: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovering = useHover(containerRef);

  const onAdd = () => {
    setFilters((prev) => [...prev, '']);
  };

  const onDelete = (index: number, item: any) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOnChange = (value: string, index: number) => {
    const newFilters = [...filters];
    newFilters[index] = value;
    setFilters(newFilters);
  };

  const FiltersDrop = () => {
    return (
      <>
        <MetadataList
          dataList={filters}
          onAdd={onAdd}
          onDelete={onDelete}
          btnText="Add Filter"
          label=""
        >
          {(item, index) => (
            <Box>
              <Input
                key={index}
                value={item}
                placeholder="enter a model name"
                suffix={
                  filters.length > 1 ? (
                    <DeleteWrapper>
                      <DeleteOutlined onClick={() => onDelete?.(index, item)} />
                    </DeleteWrapper>
                  ) : null
                }
                onChange={(e) => handleOnChange(e.target.value, index)}
              />
            </Box>
          )}
        </MetadataList>
        <Divider style={{ margin: '12px 0' }} />
        <Flex justify="end" gap={8}>
          <Button size="middle" type="text">
            Clear
          </Button>
          <Button type="primary" size="middle">
            Confirm
          </Button>
        </Flex>
      </>
    );
  };

  return (
    <Popover
      trigger={'click'}
      arrow={false}
      placement="bottom"
      content={FiltersDrop()}
      styles={{
        root: {
          width: '240px'
        }
      }}
    >
      <Container>
        <span className="holder">Export filter</span>
      </Container>
    </Popover>
  );
};

export default CompareConditions;
