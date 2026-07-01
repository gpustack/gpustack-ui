import { clusterDetailAtom } from '@/atoms/clusters';
import GPUList from '@/pages/resources/components/gpus';
import WorkerList from '@/pages/resources/components/workers';
import { getGPUStackPlugin } from '@/plugins';
import { IconFont } from '@gpustack/core-ui';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { Tabs, type TabsProps } from 'antd';
import { useAtomValue } from 'jotai';
import { HeaderLeft } from '../_components/page-box';
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

  // Extension slot: a registered plugin may inject additional tab
  // items (e.g. per-cluster access / quota panels) by exporting
  // ``clusterDetail.extraTabs(clusterId, intl)`` that returns an
  // ``items`` array. The plugin's items are appended after the
  // built-in tabs; without a plugin this is just ``[]`` and the
  // tab strip is unchanged. ``intl`` is threaded through so plugin
  // tabs can resolve i18n labels to plain strings — antd Tabs'
  // icon-text gap collapses when ``label`` is a ReactNode rather
  // than a string, so matching the built-in tabs' shape keeps the
  // gap visually consistent.
  type TabItem = NonNullable<TabsProps['items']>[number];
  const extraTabs = (getGPUStackPlugin()?.clusterDetail?.extraTabs?.(
    Number(id),
    intl
  ) ?? []) as TabItem[];

  return (
    <>
      <HeaderLeft>
        <PageBreadcrumb items={breadcrumbItems} />
      </HeaderLeft>
      <ClusterBasic clusterId={Number(id)}></ClusterBasic>
      <ClusterSystemLoad clusterId={Number(id)}></ClusterSystemLoad>
      <Tabs
        type="card"
        style={{ marginTop: 24 }}
        defaultActiveKey="workers"
        items={[
          {
            key: 'workers',
            label: intl.formatMessage({ id: 'resources.nodes' }),
            icon: <IconFont type="icon-resources" />,
            children: (
              <WorkerList clusterId={Number(id)} source="clusterDetail" />
            )
          },
          {
            key: 'gpus',
            label: intl.formatMessage({ id: 'menu.resources.gpus' }),
            icon: <IconFont type="icon-gpu1" />,
            children: <GPUList clusterId={Number(id)} source="clusterDetail" />
          },
          ...extraTabs
        ]}
      />
    </>
  );
};

export default ClusterDetailModal;
