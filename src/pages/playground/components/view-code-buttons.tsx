import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';
import IconFont from '../../../components/icon-font';

const ViewCodeButtons: React.FC<{
  handleViewCode: () => void;
  handleToggleCollapse: () => void;
  activeKey: string;
}> = ({ handleViewCode, handleToggleCollapse, activeKey }) => {
  const intl = useIntl();

  if (activeKey === 'compare') {
    return null;
  }

  return (
    <Space key="buttons" style={{ marginRight: 8 }}>
      <Button
        size="middle"
        onClick={handleViewCode}
        icon={<IconFont type="icon-code" className="font-size-16"></IconFont>}
      >
        {intl.formatMessage({ id: 'playground.viewcode' })}
      </Button>
      <Button
        size="middle"
        onClick={handleToggleCollapse}
        icon={
          <IconFont
            type="icon-a-layout6-line"
            className="font-size-16"
          ></IconFont>
        }
      ></Button>
    </Space>
  );
};

export default ViewCodeButtons;
