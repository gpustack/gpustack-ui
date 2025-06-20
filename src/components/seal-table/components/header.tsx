import { Col, Row } from 'antd';
import React from 'react';
import { SealColumnProps } from '../types';
import TableHeader from './table-header';

interface HeaderProps {
  columns: SealColumnProps[];
  onSort?: (dataIndex: string, order: any) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onSort } = props;

  return (
    <Row className="row">
      {props.columns?.map((columnProps, i) => {
        const {
          title,
          dataIndex,
          align,
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
              sorter={sorter}
              dataIndex={dataIndex}
              sortOrder={sortOrder}
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
