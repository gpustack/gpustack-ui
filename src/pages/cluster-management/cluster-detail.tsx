import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { PageContainerInner } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import ClusterMetrics from './components/cluster-metrics';

const ClusterDetailModal = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider');
  const clusterName = searchParams.get('name');

  const breadcrumbItems = [
    {
      title: <a>{intl.formatMessage({ id: 'clusters.title' })}</a>,
      onClick: () => navigate(-1)
    },
    {
      title: clusterName
    }
  ];

  return (
    <PageContainerInner
      header={{
        title: <PageBreadcrumb items={breadcrumbItems} />
      }}
    >
      <ClusterMetrics />
    </PageContainerInner>
  );
};

export default ClusterDetailModal;
