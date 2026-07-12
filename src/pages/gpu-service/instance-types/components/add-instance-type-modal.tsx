import useSubmitLock from '@/hooks/use-submit-lock';
import Separator from '@/pages/llmodels/components/separator';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { FlavorItem, FormData } from '../config/types';
import GPUServiceInstanceTypeForm from '../forms';
import useQueryFlavors from '../services/use-query-flavors';
import styles from '../styles/instance-types.module.less';
import FlavorList from './flavor-list';

type AddInstanceTypeModalProps = {
  title: string;
  open: boolean;
  clusterId?: number;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const ColTitle: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <Typography.Title
    level={3}
    style={{
      fontSize: 14,
      paddingTop: 10,
      paddingBottom: 16,
      margin: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--ant-color-bg-elevated)',
      ...style
    }}
  >
    {children}
  </Typography.Title>
);

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
        wrapper: { width: 'min(900px, calc(100vw - 220px))' },
        body: { overflowY: 'hidden' }
      }}
      footer={false}
    >
      <div className={styles.container}>
        <div className={styles.colWrapper}>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <div className={styles.panelBody}>
              <div className={styles.stickyHead}>
                <ColTitle
                  style={{
                    paddingBottom: 0
                  }}
                >
                  {intl.formatMessage({ id: 'gpuservice.instanceType.flavor' })}
                </ColTitle>
              </div>
              <FlavorList
                value={selectedFlavor?.name}
                dataList={flavorList}
                loading={flavorLoading}
                onChange={setSelectedFlavor}
              />
            </div>
          </ColumnWrapper>
          <Separator />
        </div>
        <div className={styles.formWrapper}>
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
            <ColTitle>
              {intl.formatMessage({ id: 'common.title.config' })}
            </ColTitle>
            <GPUServiceInstanceTypeForm
              ref={form}
              open={open}
              selectedFlavor={selectedFlavor}
              onFinish={onFinish}
              onFinishFailed={release}
            />
          </ColumnWrapper>
        </div>
      </div>
    </GSDrawer>
  );
};

export default AddInstanceTypeModal;
