import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Divider, Flex, Table, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import PageBox, { HeaderLeft } from '../../_components/page-box';
import {
  activateGPUInstanceType,
  deactivateGPUInstanceType,
  deleteGPUInstanceType
} from './apis';
import AddInstanceTypeModal from './components/add-instance-type-modal';
import { FormData, ListItem } from './config/types';
import useCreateInstanceTypeModal from './hooks/use-create-instance-type-modal';
import useInstanceTypeColumns from './hooks/use-instance-type-columns';
import useCreateInstanceType from './services/use-create-instance-type';
import useQueryInstanceTypes from './services/use-query-instance-types';

const GPUServiceInstanceTypes: React.FC = () => {
  const intl = useIntl();
  const deleteModalRef = useRef<any>(null);
  const [clusterId, setClusterId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [loaded, setLoaded] = useState(false);

  const {
    clusterList,
    fetchClusterList,
    loading: clusterLoading
  } = useQueryClusterList();
  const {
    dataList,
    loading: instanceTypesLoading,
    fetchInstanceTypes,
    startWatch
  } = useQueryInstanceTypes();
  const { fetchData: createInstanceType } = useCreateInstanceType();
  const {
    openInstanceTypeModalStatus,
    openInstanceTypeModal,
    closeInstanceTypeModal
  } = useCreateInstanceTypeModal();

  // Only Kubernetes clusters own GPU instance types.
  const k8sClusters = useMemo(
    () => clusterList.filter((c) => c.provider === ProviderValueMap.Kubernetes),
    [clusterList]
  );

  // Fetch the visible clusters, default to the first Kubernetes one, then load
  // its instance types. Action-driven: subsequent loads fire from the cluster
  // picker / refresh, never from an effect dependency.
  useEffect(() => {
    const init = async () => {
      const items = await fetchClusterList({ page: -1 });
      const firstK8s = (items || []).find(
        (c: any) => c.provider === ProviderValueMap.Kubernetes
      );
      if (firstK8s?.id != null) {
        setClusterId(firstK8s.id);
        await fetchInstanceTypes(firstK8s.id);
        startWatch(firstK8s.id);
      }
      setLoaded(true);
    };
    init();
  }, []);

  const handleClusterChange = useMemoizedFn(async (value: number) => {
    setClusterId(value);
    setKeyword('');
    await fetchInstanceTypes(value);
    startWatch(value);
  });

  const handleRefresh = useMemoizedFn(() => {
    if (clusterId != null) {
      fetchInstanceTypes(clusterId);
    }
  });

  const handleNameChange = useMemoizedFn(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setKeyword(e.target.value);
    }
  );

  const handleAdd = useMemoizedFn(() => {
    openInstanceTypeModal(
      intl.formatMessage({ id: 'gpuservice.instanceType.add' })
    );
  });

  const handleModalOk = useMemoizedFn(async (data: FormData) => {
    if (clusterId == null) return;
    try {
      await createInstanceType({ cluster_id: clusterId, data });
      closeInstanceTypeModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      fetchInstanceTypes(clusterId);
    } catch (error) {
      // handled by the request interceptor
    }
  });

  const handleDelete = useMemoizedFn((record: ListItem) => {
    if (clusterId == null) return;
    deleteModalRef.current?.show({
      content: intl.formatMessage({ id: 'gpuservice.instanceType' }),
      operation: 'common.delete.single.confirm',
      name: record.name,
      async onOk() {
        await deleteGPUInstanceType({
          name: record.name,
          cluster_id: clusterId
        });
        fetchInstanceTypes(clusterId);
      }
    });
  });

  const handleToggleActive = useMemoizedFn(
    (record: ListItem, activate: boolean) => {
      if (clusterId == null) return;
      const action = activate
        ? activateGPUInstanceType
        : deactivateGPUInstanceType;
      deleteModalRef.current?.show({
        content: intl.formatMessage({ id: 'gpuservice.instanceType' }),
        title: activate
          ? 'common.title.activate.confirm'
          : 'common.title.deactivate.confirm',
        okText: activate
          ? 'gpuservice.instanceType.activate'
          : 'gpuservice.instanceType.deactivate',
        operation: activate
          ? 'common.activate.single.confirm'
          : 'common.deactivate.single.confirm',
        name: record.spec?.displayName || record.name,
        async onOk() {
          await action({ name: record.name, cluster_id: clusterId });
          message.success(intl.formatMessage({ id: 'common.message.success' }));
          fetchInstanceTypes(clusterId);
        }
      });
    }
  );

  const handleSelect = useMemoizedFn((val: string, record: ListItem) => {
    if (val === 'delete') {
      handleDelete(record);
    } else if (val === 'activate') {
      handleToggleActive(record, true);
    } else if (val === 'deactivate') {
      handleToggleActive(record, false);
    }
  });

  const columns = useInstanceTypeColumns({ handleSelect });

  const filteredList = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return dataList;
    return dataList.filter((item) => item.name.toLowerCase().includes(trimmed));
  }, [dataList, keyword]);

  const hasK8sCluster = k8sClusters.length > 0;

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={instanceTypesLoading || clusterLoading}
        loadend={loaded}
        dataSource={filteredList}
        image={<IconFont type="icon-gpu1" />}
        filters={keyword ? { search: keyword } : undefined}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.instanceType.nofound'
        })}
        title={intl.formatMessage({
          id: 'noresult.gpuservice.instanceType.title'
        })}
        subTitle={
          hasK8sCluster
            ? intl.formatMessage({
                id: 'noresult.gpuservice.instanceType.subTitle'
              })
            : intl.formatMessage({ id: 'noresult.resources.k8sCluster' })
        }
        {...(hasK8sCluster
          ? {
              onClick: handleAdd,
              buttonText: intl.formatMessage({ id: 'noresult.button.add' })
            }
          : {})}
      />
    );
  };

  return (
    <>
      <HeaderLeft>
        <Flex align="center">
          <span className="font-600">
            {intl.formatMessage({ id: 'gpuservice.instance.types' })}
          </span>
          <Divider orientation="vertical" style={{ margin: '0 16px' }} />
          <BaseSelect
            size="small"
            variant="borderless"
            style={{ minWidth: 160 }}
            popupMatchSelectWidth={false}
            options={k8sClusters}
            value={clusterId}
            onChange={handleClusterChange}
          />
        </Flex>
      </HeaderLeft>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={false}
          inputHolder={intl.formatMessage({
            id: 'gpuservice.instanceType.filter.name'
          })}
          buttonText={intl.formatMessage({
            id: 'gpuservice.instanceType.add'
          })}
          handleSearch={handleRefresh}
          handleClickPrimary={hasK8sCluster ? handleAdd : undefined}
          handleInputChange={handleNameChange}
          widths={{ input: 300 }}
        />
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={filteredList}
            scroll={{ x: 'max-content' }}
            className={'scroll-table'}
            loading={{
              spinning: instanceTypesLoading || clusterLoading,
              size: 'middle'
            }}
            rowKey={(record) => record.name}
            pagination={false}
          />
        </ConfigProvider>
      </PageBox>
      <AddInstanceTypeModal
        open={openInstanceTypeModalStatus.open}
        title={openInstanceTypeModalStatus.title}
        clusterId={clusterId}
        onCancel={closeInstanceTypeModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={deleteModalRef} />
    </>
  );
};

export default GPUServiceInstanceTypes;
