import {
  Input as CInput,
  LabelSelector,
  ModalFooter,
  ScrollerModal,
  useSubmitLock
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { manfacturerValueMap } from '../config/gpu-driver';
import type {
  GPUDeviceItem,
  WorkerLabelsFormData,
  WorkerLabelsFormPayload
} from '../config/types';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
  onOk: (values: WorkerLabelsFormPayload) => Promise<void>;
  data: WorkerLabelsFormData;
  gpuDevices?: Pick<GPUDeviceItem, 'vendor'>[] | null;
  /** A selection of one worker still uses batch merge semantics. */
  batch?: boolean;
  /** Number of workers receiving the label patch. */
  count?: number;
};
const UpdateLabels: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, data, onOk, batch, count, gpuDevices } = props || {};
  const intl = useIntl();
  const [form] = Form.useForm<WorkerLabelsFormData>();
  const labels = Form.useWatch('labels', form);
  const labelsAtOpen = React.useRef<WorkerLabelsFormData['labels']>();
  React.useEffect(() => {
    if (open) {
      labelsAtOpen.current ??= { ...data.labels };
    } else {
      labelsAtOpen.current = undefined;
    }
  }, [open, data.labels]);
  const { loading, guard, run, release } = useSubmitLock();
  const emptyBatch = !!batch && !Object.keys(labels || {}).length;
  const isAscendOnly =
    Array.isArray(gpuDevices) &&
    gpuDevices.length > 0 &&
    gpuDevices.every(
      (device) =>
        typeof device?.vendor === 'string' &&
        device.vendor.trim().toLowerCase() === manfacturerValueMap.ASCEND
    );
  const showKvTransferInterface = !batch && !isAscendOnly;
  const kvTransferInterfaceLabel = intl.formatMessage({
    id: 'resources.worker.kvTransferInterface'
  });

  const handleSubmit = () => {
    if (!emptyBatch) {
      guard(() => form.submit());
    }
  };

  const shouldUpdateLabels = (value: WorkerLabelsFormData['labels'] = {}) =>
    batch ||
    (form.isFieldTouched('labels') &&
      !_.isEqual(value, labelsAtOpen.current ?? data.labels ?? {}));

  const handleFinish = async (values: WorkerLabelsFormData) => {
    const { name, labels = {}, kv_transfer_ifname } = values;
    const fieldsToSave: WorkerLabelsFormPayload = { name };
    if (shouldUpdateLabels(labels)) {
      fieldsToSave.labels = labels;
    }
    const interfaceName = kv_transfer_ifname?.trim()
      ? kv_transfer_ifname
      : null;
    if (
      showKvTransferInterface &&
      form.isFieldTouched('kv_transfer_ifname') &&
      interfaceName !== (data.kv_transfer_ifname ?? null)
    ) {
      fieldsToSave.kv_transfer_ifname = interfaceName;
    }
    await run(() => onOk(fieldsToSave));
  };

  return (
    <ScrollerModal
      title={intl.formatMessage({
        id: batch ? 'resources.worker.setLabels' : 'resources.button.edit'
      })}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      mask={{
        closable: false
      }}
      keyboard={false}
      width={600}
      maxContentHeight={'max(calc(100vh - 300px), 500px)'}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={onCancel}
          loading={loading}
          okText={
            batch
              ? intl.formatMessage({ id: 'resources.worker.setLabels' })
              : undefined
          }
          okBtnProps={{
            disabled: emptyBatch,
            style: { width: 'auto', minWidth: 88 }
          }}
        />
      }
    >
      <Form
        name="deployModel"
        form={form}
        onFinish={handleFinish}
        onFinishFailed={release}
        preserve={false}
        clearOnDestroy={true}
        initialValues={{
          name: batch
            ? intl.formatMessage(
                { id: 'resources.worker.setLabels.count' },
                { count }
              )
            : data.name,
          // Batch inputs contain only the keys to merge into each worker.
          labels: batch ? {} : data.labels,
          kv_transfer_ifname: showKvTransferInterface
            ? (data.kv_transfer_ifname ?? '')
            : undefined
        }}
      >
        <Form.Item<WorkerLabelsFormData> name="name">
          <CInput.Input
            label={intl.formatMessage({
              id: 'common.table.name'
            })}
            disabled
          />
        </Form.Item>
        {showKvTransferInterface && (
          <Form.Item<WorkerLabelsFormData>
            name="kv_transfer_ifname"
            extra={intl.formatMessage({
              id: 'resources.worker.kvTransferInterface.inherit'
            })}
          >
            <CInput.Input
              label={kvTransferInterfaceLabel}
              aria-label={kvTransferInterfaceLabel}
              placeholder={intl.formatMessage({
                id: 'resources.worker.kvTransferInterface.placeholder'
              })}
              spellCheck={false}
            />
          </Form.Item>
        )}
        <Form.Item<WorkerLabelsFormData>
          name="labels"
          extra={
            batch
              ? intl.formatMessage({ id: 'resources.worker.setLabels.hint' })
              : undefined
          }
          rules={[
            {
              validator(_rule, value) {
                if (
                  shouldUpdateLabels(value) &&
                  _.some(value, (label) => !label)
                ) {
                  return Promise.reject(
                    intl.formatMessage(
                      { id: 'common.validate.value' },
                      {
                        name: intl.formatMessage({ id: 'resources.form.label' })
                      }
                    )
                  );
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <LabelSelector
            label={intl.formatMessage({
              id: 'resources.table.labels'
            })}
            btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          ></LabelSelector>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default UpdateLabels;
