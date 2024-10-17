import { RightOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Empty,
  Pagination,
  Spin,
  type PaginationProps
} from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/header';
import TableRow from './components/table-row';
import './styles/index.less';
import { SealTableProps } from './types';

const SealTable: React.FC<SealTableProps & { pagination: PaginationProps }> = (
  props
) => {
  const {
    children,
    rowKey,
    childParentKey,
    onExpand,
    onSort,
    onCell,
    expandedRowKeys,
    loading,
    expandable,
    pollingChildren,
    watchChildren,
    rowSelection,
    pagination,
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
      if (selectedRowKeys?.length === 0) {
        setSelectAll(false);
        setIndeterminate(false);
      } else if (
        selectedRowKeys?.length === props.dataSource.length &&
        selectedRowKeys.length > 0
      ) {
        setSelectAll(true);
        setIndeterminate(false);
      } else {
        setSelectAll(false);
        setIndeterminate(true);
      }
    }
  }, [rowSelection, props.dataSource]);

  const handleSelectAllChange = (e: any) => {
    if (e.target.checked) {
      rowSelection?.onChange(props.dataSource.map((record) => record[rowKey]));
      setSelectAll(true);
      setIndeterminate(false);
    } else {
      rowSelection?.onChange([]);
      setSelectAll(false);
      setIndeterminate(false);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    pagination?.onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    pagination?.onShowSizeChange?.(current, size);
  };

  const renderHeaderPrefix = useMemo(() => {
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
  }, [expandable, rowSelection, selectAll, indeterminate]);

  const renderContent = useMemo(() => {
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
              childParentKey={childParentKey}
              pollingChildren={pollingChildren}
              watchChildren={watchChildren}
              renderChildren={renderChildren}
              loadChildren={loadChildren}
              loadChildrenAPI={loadChildrenAPI}
              onCell={onCell}
              onExpand={onExpand}
              expandedRowKeys={expandedRowKeys}
            ></TableRow>
          );
        })}
      </div>
    );
  }, [props.dataSource, expandedRowKeys, rowSelection, children]);
  return (
    <>
      <div className="seal-table-container">
        {
          <div className="header-row-wrapper">
            {renderHeaderPrefix}
            <Header onSort={onSort}>{children}</Header>
          </div>
        }

        <Spin spinning={loading}>{renderContent}</Spin>
      </div>
      {pagination && (
        <div className="pagination-wrapper">
          <Pagination
            {...pagination}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
          ></Pagination>
        </div>
      )}
    </>
  );
};

export default React.memo(SealTable);
