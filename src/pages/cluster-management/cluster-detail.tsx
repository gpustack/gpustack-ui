import IconFont from '@/components/icon-font';
import WorkerList from '@/pages/resources/components/workers';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { Tabs } from 'antd';
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
            label: 'Workers',
            icon: <IconFont type="icon-resources" />,
            children: (
              <WorkerList
                clusterId={id}
                showAddButton={false}
                showSelect={false}
                widths={{ input: 360 }}
                sourceType="cluster"
              />
            )
          },
          {
            key: 'deployments',
            label: 'Deployments',
            icon: <IconFont type="icon-rocket-launch1" />,
            children: <div>Deployments Content</div>
          },
          {
            key: 'gpus',
            label: 'GPUs',
            icon: <IconFont type="icon-gpu1" />,
            children: <div>GPUs Content</div>
          }
        ]}
      />
    </PageContainerInner>
  );
};

export default ClusterDetailModal;
