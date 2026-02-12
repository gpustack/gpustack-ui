import { clusterSessionAtom } from '@/atoms/clusters';
import { hideModalTemporarilyAtom } from '@/atoms/settings';
import IconFont from '@/components/icon-font';
import ScrollerModal from '@/components/scroller-modal/index';
import useUserSettings from '@/hooks/use-user-settings';
import useClusterList from '@/pages/cluster-management/hooks/use-cluster-list';
import { useIntl, useNavigate } from '@umijs/max';
import { Button } from 'antd';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 32px auto 0px;
  .title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .tips,
  .sub-title {
    color: var(--ant-color-text-tertiary);
  }
  .icon {
    font-size: 32px;
    width: 64px;
    height: 64px;
    border-radius: 32px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--ant-color-primary);
    background-color: var(--ant-color-primary-bg);
  }
  .desc {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .btn-wrapper {
    width: 100%;
    padding: 0 16px;
    margin-top: 32px;
    margin-bottom: 4px;
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
  }
`;

export default function useAddResource(options?: { onCreated?: () => void }) {
  const { onCreated } = options || {};
  const intl = useIntl();
  const navigate = useNavigate();
  const { setUserSettings, userSettings } = useUserSettings();
  const [, setClusterSession] = useAtom(clusterSessionAtom);
  const [hideModalTemporarily, setHideModalTemporarily] = useAtom(
    hideModalTemporarilyAtom
  );
  const { fetchResource, resourceCount, resourceAtom } = useClusterList();

  const [loadingStatus, setLoadingStatus] = useState({
    loading: false,
    loadend: false
  });

  const isNoResource = useMemo(() => {
    const noResource =
      !resourceAtom?.cluster_count || !resourceAtom?.worker_count;
    return noResource && !loadingStatus.loading && loadingStatus.loadend;
  }, [resourceAtom, loadingStatus]);

  const contentInfo = useMemo(() => {
    if (!resourceCount.cluster_count) {
      return {
        title: intl.formatMessage({ id: 'noresult.cluster.title' }),
        subTitle: intl.formatMessage({ id: 'noresult.resources.cluster' }),
        btnText: intl.formatMessage({ id: 'noresult.resources.gotocluster' })
      };
    }
    return {
      title: intl.formatMessage({ id: 'noresult.workers.title' }),
      subTitle: intl.formatMessage({ id: 'noresult.resources.worker' }),
      btnText: intl.formatMessage({ id: 'noresult.workers.button.add' })
    };
  }, [resourceCount, intl]);

  const open: boolean = useMemo(() => {
    return isNoResource && !userSettings.hideAddResourceModal;
  }, [isNoResource, userSettings.hideAddResourceModal]);

  const handleCreate = () => {
    setHideModalTemporarily(true);
    onCreated?.();
    if (!resourceCount.cluster_count) {
      setClusterSession({
        firstAddWorker: false,
        firstAddCluster: true
      });

      navigate(`/cluster-management/clusters/list`);
      return;
    }

    if (!resourceCount.worker_count) {
      setClusterSession({
        firstAddWorker: true,
        firstAddCluster: false
      });
      navigate(`/cluster-management/clusters/list`);
    }
  };

  const handleCancel = () => {
    setUserSettings({
      ...userSettings,
      hideAddResourceModal: true
    });
  };

  const fetchResourceData = async () => {
    setLoadingStatus({ loading: true, loadend: false });
    const { hasClusters, hasWorkers } = await fetchResource();
    setLoadingStatus({ loading: false, loadend: true });
    setUserSettings({
      ...userSettings,
      hideAddResourceModal: hasClusters && hasWorkers
    });
  };

  const NoResourceModal = (
    <ScrollerModal
      open={open && !hideModalTemporarily}
      footer={null}
      maskClosable={false}
      keyboard={false}
      closeIcon={null}
      destroyOnHidden={false}
      style={{
        top: '25%'
      }}
      onCancel={handleCancel}
    >
      <Content>
        <div className="icon">
          <IconFont type="icon-dashboard" />
        </div>
        <div className="title">{contentInfo.title}</div>
        <div className="desc">
          <div className="sub-title">{contentInfo.subTitle}</div>
        </div>
        <div className="btn-wrapper">
          <Button onClick={handleCancel} type="default" style={{ flex: 1 }}>
            {intl.formatMessage({ id: 'clusters.create.skipfornow' })}
          </Button>
          <Button onClick={handleCreate} type="primary" style={{ flex: 1 }}>
            {contentInfo.btnText}
          </Button>
        </div>
      </Content>
    </ScrollerModal>
  );

  return {
    open,
    contentInfo,
    loadingStatus,
    NoResourceModal,
    handleCreate,
    setLoadingStatus,
    handleCancel,
    fetchResource,
    fetchResourceData
  };
}
