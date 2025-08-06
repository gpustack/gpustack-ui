import { WarningOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';

interface AlertInfoProps {
  type: 'danger' | 'warning';
  message: string;
  rows?: number;
  icon?: React.ReactNode;
  ellipsis?: boolean;
  style?: React.CSSProperties;
}

const AlertInfo: React.FC<AlertInfoProps> = (props) => {
  const { message, type, rows = 1, ellipsis, style } = props;

  return (
    <>
      {message ? (
        <Typography.Paragraph
          type={type}
          ellipsis={
            ellipsis !== undefined
              ? ellipsis
              : {
                  rows: rows,
                  tooltip: message
                }
          }
          style={{
            fontWeight: 400,
            whiteSpace: 'pre-line',
            textAlign: 'center',
            padding: '2px 5px',
            borderRadius: 'var(--border-radius-base)',
            margin: 0,
            backgroundColor: 'var(--ant-color-error-bg)',
            ...style
          }}
        >
          <WarningOutlined className="m-r-8" />
          {message}
        </Typography.Paragraph>
      ) : null}
    </>
  );
};

export default React.memo(AlertInfo);
