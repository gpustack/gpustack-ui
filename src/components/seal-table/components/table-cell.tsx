import { CheckOutlined, FormOutlined, UndoOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, InputNumber, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useContext, useEffect } from 'react';
import styled from 'styled-components';
import RowContext from '../row-context';
import { SealColumnProps } from '../types';
import CellContent from './cell-content';

const CellWrapper = styled.div`
  padding: var(--ant-table-cell-padding-block)
    var(--ant-table-cell-padding-inline);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 68px;
  word-break: break-word;
  min-width: 20px;
  overflow: hidden;

  &.left {
    justify-content: flex-start;
  }

  &.right {
    justify-content: flex-end;
  }

  &.center {
    justify-content: center;
  }
`;

interface EditButtonsProps {
  isEditing: boolean;
  editable?: any;
  handleSubmit: () => void;
  handleUndo: () => void;
  handleEdit: () => void;
}

interface CellContentProps {
  isEditing: boolean;
  current: any;
  editable: any;
  onChange: (val: any) => void;
  row?: any;
  render?: (text: any, record: any) => React.ReactNode;
}

const EditButtons: React.FC<EditButtonsProps> = (props) => {
  const intl = useIntl();
  const { isEditing, editable, handleSubmit, handleUndo, handleEdit } = props;
  if (!editable) {
    return null;
  }

  if (isEditing) {
    return (
      <span className="flex-column">
        <Tooltip
          key="confirm"
          title={intl.formatMessage({ id: 'common.button.confirm' })}
        >
          <Button
            type="text"
            size="small"
            className="m-l-10"
            onClick={handleSubmit}
          >
            <CheckOutlined />
          </Button>
        </Tooltip>
        <Tooltip
          title={intl.formatMessage({ id: 'common.button.cancel' })}
          key="undo"
        >
          <Button
            type="text"
            size="small"
            className="m-l-10"
            onClick={handleUndo}
          >
            <UndoOutlined />
          </Button>
        </Tooltip>
      </span>
    );
  }
  return (
    <span className="flex-column">
      <Tooltip
        key="edit"
        title={
          _.isBoolean(editable) ? (
            intl.formatMessage({ id: 'common.button.edit' })
          ) : (
            <span>{editable.title || ''}</span>
          )
        }
      >
        <Button
          type="text"
          size="small"
          className="m-l-10"
          onClick={handleEdit}
        >
          <FormOutlined />
        </Button>
      </Tooltip>
    </span>
  );
};

const Content: React.FC<CellContentProps> = (props) => {
  const { editable, current, isEditing, row, render, onChange } = props;
  if (isEditing && editable) {
    const isNumType =
      typeof editable === 'object' && editable?.valueType === 'number';
    return isNumType ? (
      <InputNumber
        style={{ width: '80px' }}
        min={0}
        value={current}
        onChange={onChange}
      />
    ) : (
      <Input value={current} onChange={(e) => onChange(e.target.value)} />
    );
  }

  if (render) {
    return render(current, row);
  }
  return current;
};

const TableCell: React.FC<SealColumnProps> = (props) => {
  const { row, onCell } = useContext(RowContext);
  const { dataIndex, render, align, editable } = props;
  const [isEditing, setIsEditing] = React.useState(false);
  const [current, setCurrent] = React.useState(row[dataIndex]);
  const cachedValue = React.useRef(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    cachedValue.current = current;
    await onCell?.(
      {
        ...row,
        [dataIndex]: current
      },
      dataIndex
    );
    setIsEditing(false);
  };

  const handleUndo = () => {
    setCurrent(cachedValue.current);
    setIsEditing(false);
  };

  const handleValueChange = (val: any) => {
    setCurrent(val);
  };

  useEffect(() => {
    cachedValue.current = row[dataIndex];
    setCurrent(row[dataIndex]);
  }, [row[dataIndex]]);

  return (
    <CellWrapper
      className={classNames('cell', {
        left: align === 'left',
        center: align === 'center',
        right: align === 'right'
      })}
    >
      {/* <span className="cell-content flex-center">
        <Content
          onChange={handleValueChange}
          isEditing={isEditing}
          editable={editable}
          current={current}
          row={row}
          render={render}
        ></Content>
        <EditButtons
          editable={editable}
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleSubmit={handleSubmit}
          handleUndo={handleUndo}
        ></EditButtons>
      </span> */}
      <CellContent
        dataIndex={dataIndex}
        render={render}
        editable={editable}
      ></CellContent>
    </CellWrapper>
  );
};

export default TableCell;
