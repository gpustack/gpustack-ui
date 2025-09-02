import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import ClusterMetrics from './components/cluster-metrics';
import WorkerPools from './components/worker-pools';
import { ProviderValueMap } from './config';

const ClusterDetailModal = () => {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider');
  const clusterName = searchParams.get('name');
  return (
    <PageContainer
      ghost
      header={{
        title: (
          <span className="flex-center">
            <span>{clusterName}</span>
          </span>
        ),
        style: {
          paddingInline: 'var(--layout-content-header-inlinepadding)'
        },
        breadcrumb: {}
      }}
      extra={[]}
    >
      <ClusterMetrics />
      {provider === ProviderValueMap.DigitalOcean && <WorkerPools />}
    </PageContainer>
  );
};

export default ClusterDetailModal;
