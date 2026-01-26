import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import React from 'react';
import { PageContainerInner } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import DetailContent from './components/detail-content';

const Details: React.FC = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');

  const breadcrumbItems = [
    {
      title: <a>{intl.formatMessage({ id: 'benchmark.title' })}</a>,
      onClick: () => navigate(-1)
    },
    {
      title: name
    }
  ];
  return (
    <PageContainerInner
      header={{
        title: <PageBreadcrumb items={breadcrumbItems} />
      }}
    >
      <DetailContent></DetailContent>
    </PageContainerInner>
  );
};

export default Details;
