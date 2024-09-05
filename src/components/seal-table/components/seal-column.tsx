import { CheckOutlined, FormOutlined, UndoOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, InputNumber, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useContext } from 'react';
import RowContext from '../row-context';
import '../styles/cell.less';
import { SealColumnProps } from '../types';

const SealColumn: React.FC<SealColumnProps> = (props) => {
  const intl = useIntl();
  const { row, onCell } = useContext(RowContext);
  const { dataIndex, render, align, editable, valueType, title } = props;
  const [isEditing, setIsEditing] = React.useState(false);
  const [current, setCurrent] = React.useState(row[dataIndex]);
  const cachedValue = React.useRef(row[dataIndex]);

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

  const renderContent = () => {
    if (isEditing && editable) {
      return valueType === 'number' ? (
        <InputNumber
          style={{ minWidth: '100px', width: '100%' }}
          min={0}
          value={current}
          onChange={(val) => {
            setCurrent(val as any);
          }}
        />
      ) : (
        <Input
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
          }}
        />
      );
    }
    if (render) {
      return render(current, row);
    }
    return current;
  };
  return (
    <div
      className={classNames('cell', {
        'cell-left': align === 'left',
        'cell-center': align === 'center',
        'cell-right': align === 'right'
      })}
    >
      <span className="cell-content flex-center">
        {renderContent()}
        {editable && (
          <span>
            {isEditing ? (
              <>
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
              </>
            ) : (
              <Tooltip
                key="edit"
                title={
                  <span>
                    {intl.formatMessage({ id: 'common.button.edit' })}
                    <span className="m-l-5">{title}</span>
                  </span>
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
            )}
          </span>
        )}
      </span>
    </div>
  );
};

export default React.memo(SealColumn);
