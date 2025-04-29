import { useIntl } from '@umijs/max';
import { Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => {
  const intl = useIntl();
  return (
    <Result
      status="404"
      title="404"
      subTitle={intl.formatMessage({ id: 'common.exception.404' })}
    />
  );
};

export default NoFoundPage;
