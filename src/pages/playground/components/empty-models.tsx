import { useIntl, useNavigate } from '@umijs/max';
import { Empty, Typography } from 'antd';
import React from 'react';

const EmptyModels: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const intl = useIntl();
  const navigate = useNavigate();

  const handleDeployModel = () => {
    navigate('/models');
  };
  return (
    <div
      className="flex-center  justify-center"
      style={{
        ...style
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="flex-column">
            <Typography.Text type="secondary">
              {intl.formatMessage({ id: 'playground.model.noavailable' })}
            </Typography.Text>
          </div>
        }
      ></Empty>
    </div>
  );
};

export default EmptyModels;
