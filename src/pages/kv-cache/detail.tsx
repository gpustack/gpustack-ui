import { localize } from '@/utils/localize';
import { BaseSelect, DeleteModal, useQueryDataList } from '@gpustack/core-ui';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeaderLeft } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import {
  queryCacheServiceDetail,
  queryCacheServiceInstances,
  queryCacheServices
} from './apis';
import ServiceDeployments from './components/service-deployments';
import ServiceMonitor from './components/service-monitor';
import ServiceOverview from './components/service-overview';
import SubTitle from './components/sub-title';
import ViewLogsModal from './components/view-logs-modal';
import { ServiceModeValueMap } from './config';
import { CacheServiceInstanceItem, ListItem } from './config/types';
import useCacheProviders from './hooks/use-cache-providers';
import useClusterWorkerNames from './hooks/use-cluster-worker-names';
import useViewLogs from './hooks/use-view-logs';

// refresh cadence for the service state shown in the overview card
const DETAIL_POLL_INTERVAL = 60 * 1000;

const CacheServiceDetail: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const modalRef = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const serviceId = Number(id);

  const [detailData, setDetailData] = useState<ListItem | null>(null);
  const [instances, setInstances] = useState<CacheServiceInstanceItem[]>([]);
  const { getProvider } = useCacheProviders();
  const { clusterNameMap, workerNameMap } = useClusterWorkerNames();
  const { openViewLogsModalStatus, openViewLogsModal, closeViewLogsModal } =
    useViewLogs();
  const {
    dataList: serviceList,
    fetchData: fetchServiceList,
    cancelRequest: cancelServiceListRequest
  } = useQueryDataList<ListItem>({
    key: 'cacheServiceList',
    fetchList: queryCacheServices
  });

  // configured L2 backend key -> catalog display name, for the
  // monitor's L2 card suffix and series legends
  const l2BackendNames = useMemo(() => {
    const provider = detailData
      ? getProvider(detailData.provider_name)
      : undefined;
    const names: Record<string, string> = {};
    (detailData?.config?.l2_storages || []).forEach((storage) => {
      names[storage.backend] =
        localize(provider?.l2_backends?.[storage.backend]?.display_name) ||
        storage.backend;
    });
    return names;
  }, [detailData, getProvider]);

  // deduplicated: several instances can share a worker, and the filter
  // options must not repeat
  const workerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          instances.map(
            (instance) =>
              workerNameMap[instance.worker_id] || `#${instance.worker_id}`
          )
        )
      ).filter(Boolean),
    [instances, workerNameMap]
  );

  const fetchDetail = useMemoizedFn(async () => {
    if (!serviceId) {
      return;
    }
    try {
      const data = await queryCacheServiceDetail(serviceId);
      setDetailData(data);
      // only managed services have instances
      if (data.mode === ServiceModeValueMap.Managed) {
        try {
          const res = await queryCacheServiceInstances(serviceId);
          setInstances(res.items || []);
        } catch (error) {
          setInstances([]);
        }
      } else {
        setInstances([]);
      }
    } catch (error) {
      setDetailData(null);
      setInstances([]);
    }
  });

  // switch to another service's detail from the breadcrumb; a new id
  // re-renders the page in place and the children refetch on prop change
  const handleOnChange = (value: number, option: any) => {
    navigate(
      `/models/kv-cache/detail?id=${option.value}&name=${option.label}`,
      {
        replace: true
      }
    );
  };

  const breadcrumbItems = [
    {
      title: <a>{intl.formatMessage({ id: 'kvCache.title' })}</a>,
      onClick: () => navigate(-1)
    },
    {
      title: (
        <BaseSelect
          size="small"
          variant="borderless"
          options={serviceList}
          value={name}
          style={{ minWidth: 100 }}
          popupMatchSelectWidth={false}
          onChange={handleOnChange}
        ></BaseSelect>
      )
    }
  ];

  useEffect(() => {
    document.title = `${intl.formatMessage({ id: 'kvCache.title' })} - ${name}`;
  }, [name, intl]);

  useEffect(() => {
    fetchServiceList({ page: -1 });
    return () => {
      cancelServiceListRequest();
    };
  }, []);

  useEffect(() => {
    fetchDetail();
    const timer = setInterval(fetchDetail, DETAIL_POLL_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [serviceId]);

  return (
    <>
      <HeaderLeft>
        <PageBreadcrumb items={breadcrumbItems} />
      </HeaderLeft>
      <SubTitle style={{ marginTop: 0 }}>
        {intl.formatMessage({ id: 'kvCache.detail.overview' })}
      </SubTitle>
      <ServiceOverview
        data={detailData}
        provider={
          detailData ? getProvider(detailData.provider_name) : undefined
        }
        instances={instances}
        clusterNameMap={clusterNameMap}
        workerNameMap={workerNameMap}
        onViewLogs={openViewLogsModal}
      ></ServiceOverview>
      {/* monitoring sits above the instance list: per_node services can
          have one instance per worker, and a long list would push the
          charts below the fold */}
      {/* keyed by service: the breadcrumb reuses this route, and the
          monitor/table state (filters, last data) must not leak across
          services */}
      <ServiceMonitor
        key={serviceId}
        serviceId={serviceId}
        l2BackendNames={l2BackendNames}
        workerOptions={workerOptions}
      ></ServiceMonitor>
      <ServiceDeployments
        key={serviceId}
        serviceId={serviceId}
      ></ServiceDeployments>
      <ViewLogsModal
        open={openViewLogsModalStatus.open}
        url={openViewLogsModalStatus.url}
        title={openViewLogsModalStatus.name}
        tail={openViewLogsModalStatus.tail}
        onCancel={closeViewLogsModal}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default CacheServiceDetail;
