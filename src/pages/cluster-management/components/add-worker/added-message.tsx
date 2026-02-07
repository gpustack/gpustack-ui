import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';

const AddedMessage: React.FC<{ addedCount: number }> = ({ addedCount }) => {
  const intl = useIntl();
  const renderMessage = (count: number) => {
    if (count === 1) {
      return intl.formatMessage(
        {
          id: 'clusters.addworker.message.success_single'
        },
        { count: addedCount }
      );
    }
    return intl.formatMessage(
      {
        id: 'clusters.addworker.message.success_multiple'
      },
      { count: addedCount }
    );
  };

  return addedCount > 0 ? (
    <Alert
      style={{
        textAlign: 'left',
        fontWeight: 400,
        borderColor: 'var(--ant-color-success)',
        width: '100%'
      }}
      type="success"
      title={renderMessage(addedCount)}
      closable
    />
  ) : null;
};

export default AddedMessage;
