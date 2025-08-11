import { WarningOutlined } from '@ant-design/icons';
import { Result } from 'antd';
import React from 'react';

const GGUFResult: React.FC = () => {
  return (
    <Result
      status="info"
      icon={
        <WarningOutlined
          style={{ color: 'var(--ant-color-text-quaternary)' }}
        />
      }
      title={false}
      subTitle="GGUF model is not supported."
    />
  );
};

export default GGUFResult;
