import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';

const Credential: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.clusterManagement.credentials' }),
        style: {
          paddingInline: 'var(--layout-content-header-inlinepadding)'
        },
        breadcrumb: {}
      }}
      extra={[]}
    >
      {intl.formatMessage({ id: 'menu.clusterManagement.credentials' })}
    </PageContainer>
  );
};

export default Credential;
