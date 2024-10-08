import { Empty } from 'antd';
import React from 'react';

const EmptyData: React.FC<{
  height?: string | number;
  title?: React.ReactNode;
}> = ({ height, title }) => {
  return (
    <div
      style={{
        width: '100%',
        height: height || '100%'
      }}
      className="flex-center  flex-column "
    >
      {title && (
        <h3
          className="justify-center font-size-12"
          style={{ padding: '4px 0', marginBottom: 0 }}
        >
          {title}
        </h3>
      )}
      <div
        className="flex-center justify-center flex-column"
        style={{ height: '100%' }}
      >
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    </div>
  );
};

export default EmptyData;
