import { Pagination, Spin, type PaginationProps } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Header from './components/header';
import HeaderPrefix from './components/header-prefix';
import TableBody from './components/table-body';
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
    loadend,
    expandable,
    pollingChildren,
    watchChildren,
    rowSelection,
    pagination,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  const [selectState, setSelectState] = useState({
    selectAll: false,
    indeterminate: false
  });

  useEffect(() => {
    if (rowSelection) {
      const { selectedRowKeys } = rowSelection;
      const selectedKeys = new Set(rowSelection.selectedRowKeys);
      const allRowKeys = props.dataSource.map((record) => record[rowKey]);
      if (!selectedRowKeys?.length) {
        setSelectState({
          selectAll: false,
          indeterminate: false
        });
      } else if (allRowKeys.every((key) => selectedKeys.has(key))) {
        setSelectState({
          selectAll: true,
          indeterminate: false
        });
      } else {
        setSelectState({
          selectAll: false,
          indeterminate: true
        });
      }
    }
  }, [rowSelection?.selectedRowKeys, props.dataSource, rowKey]);

  const selectAllRows = () => {
    const allKeys = new Set([
      ...props.dataSource.map((record) => record[rowKey]),
      ...(rowSelection?.selectedRowKeys || [])
    ]);
    const allDatas = _.uniqBy(
      [...props.dataSource, ...(rowSelection?.selectedRows || [])],
      (record: any) => record[rowKey]
    );

    rowSelection?.onChange([...allKeys], allDatas);
  };

  const deselectAllRows = () => {
    const currentKeys = props.dataSource.map((record) => record[rowKey]);
    rowSelection?.removeSelectedKeys?.(currentKeys);
  };

  const handleSelectAllChange = (e: any) => {
    if (e.target.checked) {
      selectAllRows();
    } else {
      deselectAllRows();
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    pagination?.onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    pagination?.onShowSizeChange?.(current, size);
  };

  return (
    <>
      <div className="seal-table-container">
        <div className="header-row-wrapper">
          <HeaderPrefix
            selectAll={selectState.selectAll}
            indeterminate={selectState.indeterminate}
            onSelectAll={handleSelectAllChange}
            expandable={expandable}
            enableSelection={rowSelection?.enableSelection}
          ></HeaderPrefix>
          <Header onSort={onSort}>{children}</Header>
        </div>
        <Spin spinning={loading}>
          <TableBody
            dataSource={props.dataSource}
            columns={children}
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
          />
        </Spin>
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

export default SealTable;
