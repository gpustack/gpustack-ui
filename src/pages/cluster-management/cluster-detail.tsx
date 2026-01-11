import WorkerList from '@/pages/resources/components/workers';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { PageContainerInner } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import ClusterSystemLoad from './components/detail/cluster-system-load';

const ClusterDetailModal = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
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
      <ClusterSystemLoad clusterId={Number(id)}></ClusterSystemLoad>
      <WorkerList
        clusterId={id}
        showAddButton={false}
        showSelect={false}
        widths={{ input: 360 }}
        sourceType="cluster"
      />
    </PageContainerInner>
  );
};

export default ClusterDetailModal;
