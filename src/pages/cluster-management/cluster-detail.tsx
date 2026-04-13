import { clusterDetailAtom } from '@/atoms/clusters';
import Deployments from '@/pages/llmodels/deployments';
import GPUList from '@/pages/resources/components/gpus';
import WorkerList from '@/pages/resources/components/workers';
import { IconFont } from '@gpustack/core-ui';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { Tabs } from 'antd';
import { useAtomValue } from 'jotai';
import { PageContainerInner } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import ClusterBasic from './components/detail/cluster-basic';
import ClusterSystemLoad from './components/detail/cluster-system-load';

const ClusterDetailModal = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const clusterName = searchParams.get('name');
  const clusterDetailData = useAtomValue(clusterDetailAtom);

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
      <ClusterBasic clusterId={Number(id)}></ClusterBasic>
      <ClusterSystemLoad clusterId={Number(id)}></ClusterSystemLoad>
      <Tabs
        type="card"
        style={{ marginTop: 24 }}
        defaultActiveKey="workers"
        items={[
          {
            key: 'workers',
            label: `Workers`,
            icon: <IconFont type="icon-resources" />,
            children: <WorkerList />
          },
          {
            key: 'deployments',
            label: `Deployments`,
            icon: <IconFont type="icon-rocket-launch1" />,
            children: <Deployments></Deployments>
          },
          {
            key: 'gpus',
            label: `GPUs`,
            icon: <IconFont type="icon-gpu1" />,
            children: <GPUList />
          }
        ]}
      />
    </PageContainerInner>
  );
};

export default ClusterDetailModal;
