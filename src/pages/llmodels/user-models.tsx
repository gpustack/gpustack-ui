import { FilterBar } from '@/components/page-tools';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';

const UserModels: React.FC = () => {
  const intl = useIntl();

  const handleSearch = () => {
    // Implement search functionality here
  };

  const handleInputChange = () => {};

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
      <FilterBar
        showSelect={true}
        showPrimaryButton={false}
        showDeleteButton={false}
        selectHolder="Filter by cluster"
        marginBottom={22}
        marginTop={30}
        buttonText={intl.formatMessage({ id: 'resources.button.create' })}
        handleInputChange={() => {}}
        handleSearch={handleSearch}
        width={{ input: 200 }}
      ></FilterBar>
    </PageContainer>
  );
};

export default UserModels;
