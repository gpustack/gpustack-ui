import { WarningOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';

interface AlertInfoProps {
  type: 'danger' | 'warning';
  message: string;
  rows?: number;
  icon?: React.ReactNode;
}

const AlertInfo: React.FC<AlertInfoProps> = (props) => {
  const { message, type, rows = 1 } = props;
  if (!message) {
    return null;
  }

  return (
    <Typography.Paragraph
      type={type}
      ellipsis={{
        rows: rows,
        tooltip: message
      }}
      style={{
        textAlign: 'center',
        padding: '2px 5px',
        borderRadius: 'var(--border-radius-base)',
        margin: 0,
        backgroundColor: 'var(--ant-color-error-bg)'
      }}
    >
      <WarningOutlined className="m-r-8" />
      {message}
    </Typography.Paragraph>
  );
};

export default React.memo(AlertInfo);
