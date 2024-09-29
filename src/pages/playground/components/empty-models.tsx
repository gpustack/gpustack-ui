import { useIntl, useNavigate } from '@umijs/max';
import { Button, Empty, Typography } from 'antd';
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
      className="flex-center justify-center"
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
            <Typography.Text type="secondary">
              {intl.formatMessage({ id: 'playground.model.noavailable.tips' })}
            </Typography.Text>
          </div>
        }
      >
        <Button type="primary" onClick={handleDeployModel}>
          {intl.formatMessage({ id: 'models.button.deploy' })}
        </Button>
      </Empty>
    </div>
  );
};

export default EmptyModels;
