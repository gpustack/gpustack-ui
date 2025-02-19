import { Pagination, Spin, type PaginationProps } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import Header from './components/header';
import HeaderPrefix from './components/header-prefix';
import TableBody from './components/table-body';
import './styles/index.less';
import { SealColumnProps, SealTableProps } from './types';

const SealTable: React.FC<SealTableProps & { pagination: PaginationProps }> = (
  props
) => {
  const {
    columns,
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

  const parsedColumns = useMemo(() => {
    if (columns) return columns;

    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((child) => {
        const column = child as React.ReactElement<SealColumnProps>;
        const { title, dataIndex, key, render, ...restProps } = column.props;

        return {
          title,
          dataIndex,
          key: key || dataIndex,
          render,
          ...restProps
        };
      });
  }, [columns, children]);

  const selectState = useMemo(() => {
    const selectedRowKeys = rowSelection?.selectedRowKeys || [];
    const selectedKeys = new Set(selectedRowKeys);
    const allRowKeys = props.dataSource.map((record) => record[rowKey]);
    if (!selectedRowKeys?.length) {
      return {
        selectAll: false,
        indeterminate: false
      };
    }
    if (allRowKeys.every((key) => selectedKeys.has(key))) {
      return {
        selectAll: true,
        indeterminate: false
      };
    }
    return {
      selectAll: false,
      indeterminate: true
    };
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
          <Header onSort={onSort} columns={parsedColumns}></Header>
        </div>
        <Spin spinning={loading}>
          <TableBody
            dataSource={props.dataSource}
            columns={parsedColumns}
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
