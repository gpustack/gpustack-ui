import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';

const UserModels: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.models.userModels' }),
        style: {
          paddingInline: 'var(--layout-content-header-inlinepadding)'
        },
        breadcrumb: {}
      }}
      extra={[]}
    >
      {intl.formatMessage({ id: 'menu.models.userModels' })}
    </PageContainer>
  );
};

export default UserModels;
