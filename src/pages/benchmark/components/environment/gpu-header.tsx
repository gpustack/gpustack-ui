import { Col, Row } from 'antd';
import React from 'react';

const GPUHeader: React.FC<{
  columns: {
    title: string;
    key: string;
    span: number;
    colStyle?: React.CSSProperties;
  }[];
}> = ({ columns }) => {
  return (
    <Row style={{ width: '100%' }} align="middle">
      {columns.map((col) => (
        <Col key={col.key} span={col.span} style={{ ...col.colStyle }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 4,
              flexDirection: 'column'
            }}
          >
            <span
              style={{
                color: 'var(--ant-color-text-tertiary)',
                fontSize: 12
              }}
            >
              {col.title}
            </span>
          </span>
        </Col>
      ))}
    </Row>
  );
};

export default GPUHeader;
