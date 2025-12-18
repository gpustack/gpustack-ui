import { clusterSessionAtom } from '@/atoms/clusters';
import IconFont from '@/components/icon-font';
import ScrollerModal from '@/components/scroller-modal/index';
import { PageAction } from '@/config';
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
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
  }
`;

export default function useAddResource() {
  const intl = useIntl();
  const navigate = useNavigate();
  const [, setClusterSession] = useAtom(clusterSessionAtom);

  const { fetchAll, clusterList, workerList, clustersAtom, workersAtom } =
    useClusterList();

  const [hiddenModal, setHiddenModal] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({
    loading: false,
    loadend: false
  });

  const isNoResource = useMemo(() => {
    const noResource = workerList.length === 0 || clusterList.length === 0;
    return noResource && !loadingStatus.loading && loadingStatus.loadend;
  }, [workersAtom.length, clustersAtom.length, loadingStatus]);

  const contentInfo = useMemo(() => {
    if (clusterList.length === 0) {
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
  }, [clusterList.length, workerList.length, intl]);

  const open: boolean = useMemo(() => {
    return isNoResource && !hiddenModal;
  }, [isNoResource, hiddenModal]);

  const handleCreate = () => {
    if (clusterList.length === 0) {
      setClusterSession({
        firstAddWorker: false,
        firstAddCluster: true
      });

      navigate(
        `/cluster-management/clusters/create?action=${PageAction.CREATE}`
      );
      return;
    }

    if (workerList.length === 0) {
      setClusterSession({
        firstAddWorker: true,
        firstAddCluster: false
      });
      navigate(`/cluster-management/clusters/list`);
    }
  };

  const handleCancel = () => {
    setHiddenModal(true);
  };

  const Modal = (
    <ScrollerModal
      open={open}
      footer={null}
      maskClosable={false}
      closeIcon={null}
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
    clusterList,
    Modal,
    handleCreate,
    setLoadingStatus,
    handleCancel,
    fetchAll
  };
}
