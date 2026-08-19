import {
  ColumnWrapper,
  GSDrawer,
  ModalFooter,
  useSubmitLock
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { FlavorItem, FormData } from '../config/types';
import GPUServiceInstanceTypeForm from '../forms';
import useQueryFlavors from '../services/use-query-flavors';

type AddInstanceTypeModalProps = {
  title: string;
  open: boolean;
  clusterList: Global.BaseOption<number>[];
  // Returns a promise because ``useSubmitLock``'s ``run`` awaits it to decide
  // when to release the lock; typing it ``void`` would let a caller pass a
  // synchronous handler and release the lock before the write finished.
  onOk: (clusterId: number, values: FormData) => Promise<void>;
  onCancel: () => void;
};

const AddInstanceTypeModal: React.FC<AddInstanceTypeModalProps> = ({
  title,
  open,
  clusterList,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const { loading, guard, run, release } = useSubmitLock();
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorItem | null>(null);
  const {
    dataList: flavorList,
    loading: flavorLoading,
    fetchFlavors,
    cancelRequest,
    setDataList: setFlavorList
  } = useQueryFlavors();

  // Flavors are the chosen cluster's, and the drawer now opens without one, so
  // they load from the cluster select's handler instead of on open. Closing
  // clears them, otherwise the next open would flash the previous cluster's.
  //
  // Cancel before clearing: a request still in flight would resolve after this
  // and repopulate exactly what was just cleared, which is the stale flash this
  // effect exists to prevent. The hook rejects it as CANCEL_PREVIOUS_REQUEST,
  // which its own onError ignores and handleClusterChange's catch turns into a
  // cleared selection.
  useEffect(() => {
    if (!open) {
      cancelRequest();
      setSelectedFlavor(null);
      setFlavorList([]);
    }
  }, [open]);

  // Auto-select the first flavor of the picked cluster, so the form's
  // flavor-derived fields (group / acceleratable) are always set.
  //
  // Drop the previous cluster's flavor *before* awaiting the new list. Save
  // stays clickable while the flavors load — the footer's spinner is the submit
  // lock's, not this fetch's — and handleSubmit only checks that some flavor is
  // selected, so a click inside that window would submit the new cluster_id
  // carrying the old cluster's acceleratorGroup / acceleratable. Clearing on
  // failure too: a rejected fetch must not leave a stale selection behind, and
  // the rejection is caught because this is an event handler, where it would
  // otherwise surface as an unhandled rejection.
  const handleClusterChange = async (clusterId: number) => {
    setSelectedFlavor(null);
    setFlavorList([]);
    try {
      const list = await fetchFlavors(clusterId);
      setSelectedFlavor(list?.[0] ?? null);
    } catch {
      setSelectedFlavor(null);
    }
  };

  const handleSubmit = () => {
    if (!selectedFlavor) {
      message.warning(
        intl.formatMessage({ id: 'gpuservice.instanceType.flavor.required' })
      );
      return;
    }
    guard(() => form.current?.submit());
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (clusterId: number, values: FormData) => {
    await run(() => onOk(clusterId, { ...values }));
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden
      closeIcon={false}
      mask={{ closable: false }}
      keyboard={false}
      styles={{
        wrapper: { width: 'min(600px, calc(100vw - 220px))' },
        body: { overflowY: 'hidden' }
      }}
      footer={false}
    >
      <ColumnWrapper
        styles={{ container: { paddingBlock: 0 } }}
        footer={
          <ModalFooter
            onOk={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            style={{
              padding: '16px 24px 8px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          />
        }
      >
        <GPUServiceInstanceTypeForm
          ref={form}
          open={open}
          clusterList={clusterList}
          selectedFlavor={selectedFlavor}
          flavorList={flavorList}
          flavorLoading={flavorLoading}
          onClusterChange={handleClusterChange}
          onFlavorChange={setSelectedFlavor}
          onFinish={onFinish}
          onFinishFailed={release}
        />
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddInstanceTypeModal;
