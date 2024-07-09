import { RightOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Empty, Row, Spin } from 'antd';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import TableHeader from './components/table-header';
import TableRow from './components/table-row';
import './styles/index.less';
import { SealColumnProps, SealTableProps } from './types';

const SealTable: React.FC<SealTableProps> = (props) => {
  const {
    children,
    rowKey,
    onExpand,
    expandedRowKeys,
    loading,
    expandable,
    pollingChildren,
    watchChildren,
    rowSelection,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  console.log('sealtable====');
  const [selectAll, setSelectAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const tableContent = useRef(null);

  useEffect(() => {
    if (rowSelection) {
      const { selectedRowKeys } = rowSelection;
      if (selectedRowKeys.length === 0) {
        setSelectAll(false);
        setIndeterminate(false);
      } else if (selectedRowKeys.length === props.dataSource.length) {
        setSelectAll(true);
        setIndeterminate(false);
      } else {
        setSelectAll(false);
        setIndeterminate(true);
      }
    }
  }, [rowSelection]);

  const handleSelectAllChange = (e: any) => {
    if (e.target.checked) {
      // update selectedRowKeys
      rowSelection?.onChange(props.dataSource.map((record) => record[rowKey]));
      setSelectAll(true);
      setIndeterminate(false);
    } else {
      // update selectedRowKeys
      rowSelection?.onChange([]);
      setSelectAll(false);
      setIndeterminate(false);
    }
  };
  const renderHeaderPrefix = () => {
    if (expandable && rowSelection) {
      return (
        <div className="header-row-prefix-wrapper">
          <span style={{ marginRight: 5, padding: '0 14px' }}></span>
          <Checkbox
            onChange={handleSelectAllChange}
            indeterminate={indeterminate}
            checked={selectAll}
          ></Checkbox>
        </div>
      );
    }
    if (expandable) {
      return (
        <div className="header-row-prefix-wrapper">
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small">
              <RightOutlined />
            </Button>
          ) : (
            expandable
          )}
        </div>
      );
    }
    if (rowSelection) {
      return (
        <div className="header-row-prefix-wrapper">{<Checkbox></Checkbox>}</div>
      );
    }
    return null;
  };

  const renderHeader = () => {
    return (
      <div className="header-row-wrapper">
        {renderHeaderPrefix()}
        <Row className="row">
          {React.Children.map(props.children, (child, i) => {
            const { props: columnProps } = child as any;
            const { title, align, span, headerStyle } =
              columnProps as SealColumnProps;
            if (React.isValidElement(child)) {
              return (
                <Col span={span} key={i}>
                  <TableHeader
                    title={title}
                    style={headerStyle}
                    firstCell={i === 0}
                    align={align}
                    lastCell={i === props.children.length - 1}
                  ></TableHeader>
                </Col>
              );
            }
            return null;
          })}
        </Row>
      </div>
    );
  };

  const renderContent = () => {
    if (!props.dataSource.length) {
      return (
        <div className="empty-wrapper">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
        </div>
      );
    }
    return (
      <div className="seal-table-content" ref={tableContent}>
        {props.dataSource.map((item, index) => {
          return (
            <TableRow
              record={item}
              rowIndex={index}
              columns={children}
              key={item[rowKey]}
              rowSelection={rowSelection}
              expandable={expandable}
              rowKey={rowKey}
              pollingChildren={pollingChildren}
              watchChildren={watchChildren}
              renderChildren={renderChildren}
              loadChildren={loadChildren}
              loadChildrenAPI={loadChildrenAPI}
              onExpand={onExpand}
              expandedRowKeys={expandedRowKeys}
            ></TableRow>
          );
        })}
      </div>
    );
  };
  return (
    <div className="seal-table-container">
      {renderHeader()}
      {loading ? (
        <div className="spin">
          <Spin></Spin>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default React.memo(SealTable);
