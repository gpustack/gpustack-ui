import { Pagination, Spin, theme, type PaginationProps } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import Header from './components/header';
import HeaderPrefix from './components/header-prefix';
import TableBody from './components/table-body';
import './styles/index.less';
import { SealColumnProps, SealTableProps } from './types';
import useSorter from './use-sorter';

const Wrapper = styled.div<{ $token: any }>`
  --ant-table-cell-padding-inline: ${(props) =>
    props.$token.cellPaddingInline}px;
  --ant-table-cell-padding-block: ${(props) => props.$token.cellPaddingBlock}px;
  --ant-table-header-border-radius: ${(props) =>
    props.$token.headerBorderRadius}px;
  --ant-table-header-split-color: ${(props) =>
    props.$token.colorBorderSecondary};
  --ant-table-row-selected-bg: ${(props) => props.$token.rowSelectedBg};
  --ant-table-row-selected-hover-bg: ${(props) =>
    props.$token.rowSelectedHoverBg};
  --ant-table-row-hover-bg: ${(props) => props.$token.rowHoverBg};
  --ant-table-header-icon-color: ${(props) =>
    props.$token.tableHeaderIconColor};
  --ant-table-header-icon-hover-color: ${(props) =>
    props.$token.tableHeaderIconHoverColor};
`;

const SealTable: React.FC<SealTableProps & { pagination?: PaginationProps }> = (
  props
) => {
  const {
    columns,
    children,
    rowKey,
    childParentKey,
    onExpand,
    onExpandAll,
    onTableSort,
    onCell,
    expandedRowKeys,
    loading,
    loadend,
    expandable,
    pollingChildren,
    watchChildren,
    rowSelection,
    pagination,
    empty,
    sortDirections,
    showSorterTooltip,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  const { handleOnTableSort, sorterList } = useSorter({
    onTableSort,
    columns
  });
  const { token } = theme.useToken();
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

  const expandAll = useMemo(() => {
    if (expandedRowKeys?.length === 0) {
      return false;
    }
    const allKeys = new Set(expandedRowKeys);
    const currentDataKeys = props.dataSource.map((record) => record[rowKey]);
    return currentDataKeys.every((key) => allKeys.has(key));
  }, [props.dataSource, expandedRowKeys]);

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

  const handleExpandAll = (value: boolean) => {
    onExpandAll?.(value);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    pagination?.onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    pagination?.onShowSizeChange?.(current, size);
  };

  console.log('token.table', token);

  return (
    <Wrapper
      $token={{
        ...token.Table,
        tableHeaderIconColor: token.colorTextQuaternary,
        tableHeaderIconHoverColor: token.colorTextSecondary,
        colorBorderSecondary: token.colorBorderSecondary
      }}
    >
      <div className="seal-table-container">
        <div className="header-row-wrapper">
          <HeaderPrefix
            selectAll={selectState.selectAll}
            indeterminate={selectState.indeterminate}
            onSelectAll={handleSelectAllChange}
            onExpandAll={handleExpandAll}
            expandAll={expandAll}
            expandable={expandable}
            enableSelection={rowSelection?.enableSelection}
            disabled={!props.dataSource?.length}
            hasColumns={parsedColumns.length > 0}
          ></HeaderPrefix>
          <Header
            onSort={handleOnTableSort}
            columns={parsedColumns}
            sortDirections={sortDirections}
            sorterList={sorterList}
            showSorterTooltip={showSorterTooltip}
          ></Header>
        </div>
        <Spin spinning={loading}>
          <TableBody
            empty={empty}
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
    </Wrapper>
  );
};

export default SealTable;
