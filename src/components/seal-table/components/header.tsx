import { Col, Row } from 'antd';
import React from 'react';
import { OnSortFn, SealColumnProps, TableOrder } from '../types';
import TableHeader from './table-header';

interface HeaderProps {
  columns: SealColumnProps[];
  sortDirections?: ('ascend' | 'descend' | null)[];
  sorterList: TableOrder | Array<TableOrder>;
  showSorterTooltip?: boolean;
  onSort?: OnSortFn;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onSort, sortDirections, sorterList, showSorterTooltip } = props;

  return (
    <Row className="row">
      {props.columns?.map((columnProps, i) => {
        const {
          title,
          dataIndex,
          align,
          width,
          span,
          headerStyle,
          sortOrder,
          sorter,
          defaultSortOrder
        } = columnProps as SealColumnProps;
        return (
          <Col span={span} key={dataIndex || i}>
            <TableHeader
              onSort={onSort}
              showSorterTooltip={showSorterTooltip}
              sorter={sorter}
              sorterList={sorterList}
              dataIndex={dataIndex}
              sortOrder={sortOrder}
              sortDirections={sortDirections}
              width={width}
              defaultSortOrder={defaultSortOrder}
              title={title}
              style={headerStyle}
              firstCell={i === 0}
              align={align}
              lastCell={i === props.columns.length - 1}
            ></TableHeader>
          </Col>
        );
      })}
    </Row>
  );
};

export default Header;
