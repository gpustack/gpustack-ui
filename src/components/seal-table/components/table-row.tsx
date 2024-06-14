import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Empty, Row, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import RowContext from '../row-context';
import { RowContextProps, SealTableProps } from '../types';

const TableRow: React.FC<
  RowContextProps &
    Omit<SealTableProps, 'dataSource' | 'loading' | 'children' | 'empty'>
> = (props) => {
  const {
    record,
    rowIndex,
    expandable,
    rowSelection,
    rowKey,
    columns,
    onExpand,
    renderChildren,
    loadChildren
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rowSelection) {
      const { selectedRowKeys } = rowSelection;
      if (selectedRowKeys.includes(record[rowKey])) {
        setChecked(true);
      } else {
        setChecked(false);
      }
    }
  }, [rowSelection]);

  const handleRowExpand = async () => {
    setExpanded(!expanded);
    onExpand?.(!expanded, record);
    if (expanded) {
      return;
    }
    try {
      setLoading(true);
      const data = await loadChildren?.(record);
      setChildrenData(data || []);
      setLoading(false);
    } catch (error) {
      setChildrenData([]);
      setLoading(false);
    }
  };

  const handleSelectChange = (e: any) => {
    if (e.target.checked) {
      // update selectedRowKeys
      rowSelection?.onChange(
        _.uniq([...rowSelection?.selectedRowKeys, record[rowKey]])
      );
    } else {
      // update selectedRowKeys
      rowSelection?.onChange(
        rowSelection?.selectedRowKeys.filter((key) => key !== record[rowKey])
      );
    }
  };

  const renderRowPrefix = () => {
    if (expandable && rowSelection) {
      return (
        <div className="row-prefix-wrapper">
          <span style={{ marginRight: 5 }}>
            {_.isBoolean(expandable) ? (
              <Button type="text" size="small" onClick={handleRowExpand}>
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Button>
            ) : (
              expandable
            )}
          </span>
          <Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>
        </div>
      );
    }
    if (expandable) {
      return (
        <div className="row-prefix-wrapper">
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleRowExpand}>
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </Button>
          ) : (
            expandable
          )}
        </div>
      );
    }
    if (rowSelection) {
      return (
        <div className="row-prefix-wrapper">
          {
            <Checkbox
              onChange={handleSelectChange}
              checked={checked}
            ></Checkbox>
          }
        </div>
      );
    }
    return null;
  };

  return (
    <RowContext.Provider value={{ ...record, rowIndex }}>
      <div className="row-box">
        <div
          className={classNames('row-wrapper', {
            'row-wrapper-selected': checked
          })}
        >
          {renderRowPrefix()}
          <Row className="seal-table-row">
            {React.Children.map(columns, (child) => {
              const { props: columnProps } = child as any;
              if (React.isValidElement(child)) {
                return (
                  <Col
                    key={`${columnProps.dataIndex}-${rowIndex}`}
                    span={columnProps.span}
                  >
                    {child}
                  </Col>
                );
              }
              return <Col span={columnProps.span}></Col>;
            })}
          </Row>
        </div>
        {expanded && (
          <div className="expanded-row">
            <Spin spinning={loading}>
              {childrenData.length ? (
                renderChildren?.(childrenData)
              ) : (
                <Empty></Empty>
              )}
            </Spin>
          </div>
        )}
      </div>
    </RowContext.Provider>
  );
};

export default TableRow;
