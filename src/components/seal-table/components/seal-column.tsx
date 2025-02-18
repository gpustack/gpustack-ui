import { CheckOutlined, FormOutlined, UndoOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, InputNumber, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useContext, useEffect } from 'react';
import RowContext from '../row-context';
import '../styles/cell.less';
import { SealColumnProps } from '../types';

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

const CellContent: React.FC<CellContentProps> = (props) => {
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

const SealColumn: React.FC<SealColumnProps> = (props) => {
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
    <div
      className={classNames('cell', {
        'cell-left': align === 'left',
        'cell-center': align === 'center',
        'cell-right': align === 'right'
      })}
    >
      <span className="cell-content flex-center">
        <CellContent
          onChange={handleValueChange}
          isEditing={isEditing}
          editable={editable}
          current={current}
          row={row}
          render={render}
        ></CellContent>
        <EditButtons
          editable={editable}
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleSubmit={handleSubmit}
          handleUndo={handleUndo}
        ></EditButtons>
      </span>
    </div>
  );
};

export default SealColumn;
