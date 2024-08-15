import { Col, Row } from 'antd';
import React from 'react';
import { SealColumnProps } from '../types';
import TableHeader from './table-header';

interface HeaderProps {
  children: React.ReactNode[];
  onSort?: (dataIndex: string, order: any) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { onSort } = props;
  return (
    <Row className="row">
      {React.Children.map(props.children, (child, i) => {
        const { props: columnProps } = child as any;
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
        if (React.isValidElement(child)) {
          return (
            <Col span={span} key={i}>
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
                lastCell={i === props.children.length - 1}
              ></TableHeader>
            </Col>
          );
        }
        return null;
      })}
    </Row>
  );
};

export default React.memo(Header);
