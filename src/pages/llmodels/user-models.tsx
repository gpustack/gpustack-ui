import { FilterBar } from '@/components/page-tools';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';
import ModelItem from './components/model-item';

const UserModels: React.FC = () => {
  const intl = useIntl();

  const handleSearch = () => {
    // Implement search functionality here
  };

  const handleInputChange = () => {};

  const handleOnDeploy = (model: any) => {
    // Implement deploy functionality here
    console.log('Deploying model:', model);
  };

  const renderCard = (data: any) => {
    return <ModelItem model={data} onDeploy={handleOnDeploy} />;
  };

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
      {/* <CardList
        dataList={dataSource.dataList}
        loading={dataSource.loading}
        onDeploy={handleOnDeploy}
        activeId={-1}
        isFirst={isFirst}
        Skeleton={CatalogSkelton}
        renderItem={renderCard}
      ></CardList> */}
    </PageContainer>
  );
};

export default UserModels;
