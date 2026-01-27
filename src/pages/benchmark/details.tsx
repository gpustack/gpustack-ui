import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import React, { useEffect } from 'react';
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
  useEffect(() => {
    document.title = `${intl.formatMessage({ id: 'benchmark.title' })} - ${name}`;
  }, [name, intl]);

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
