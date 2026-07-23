import useSubmitLock from '@/hooks/use-submit-lock';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { FlavorItem, FormData } from '../config/types';
import GPUServiceInstanceTypeForm from '../forms';
import useQueryFlavors from '../services/use-query-flavors';

type AddInstanceTypeModalProps = {
  title: string;
  open: boolean;
  clusterId?: number;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const AddInstanceTypeModal: React.FC<AddInstanceTypeModalProps> = ({
  title,
  open,
  clusterId,
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
    fetchFlavors
  } = useQueryFlavors();

  // Fetch flavors when the drawer opens and auto-select the first one, so the
  // form's flavor-derived fields (group / acceleratable) are always set.
  useEffect(() => {
    if (!open) {
      setSelectedFlavor(null);
      return;
    }
    if (!clusterId) return;
    const load = async () => {
      const list = await fetchFlavors(clusterId);
      setSelectedFlavor(list?.[0] ?? null);
    };
    load();
  }, [open, clusterId]);

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

  const onFinish = async (values: FormData) => {
    await run(() => onOk({ ...values }));
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
          selectedFlavor={selectedFlavor}
          flavorList={flavorList}
          flavorLoading={flavorLoading}
          onFlavorChange={setSelectedFlavor}
          onFinish={onFinish}
          onFinishFailed={release}
        />
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddInstanceTypeModal;
