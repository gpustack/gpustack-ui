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
import { WorkerLabelsFormData } from '../config/types';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
  onOk: (values: WorkerLabelsFormData) => Promise<void>;
  data: {
    name: string;
    labels: Record<string, string>;
  };
  /** A selection of one worker still uses batch merge semantics. */
  batch?: boolean;
  /** Number of workers receiving the label patch. */
  count?: number;
};
const UpdateLabels: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, data, onOk, batch, count } = props || {};
  const intl = useIntl();
  const [form] = Form.useForm<WorkerLabelsFormData>();
  const labels = Form.useWatch('labels', form);
  const { loading, guard, run, release } = useSubmitLock();
  const emptyBatch = !!batch && !Object.keys(labels || {}).length;

  const handleSubmit = () => {
    if (!emptyBatch) {
      guard(() => form.submit());
    }
  };

  const handleFinish = async (values: WorkerLabelsFormData) => {
    await run(() => onOk(values));
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
          labels: batch ? {} : data.labels
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
        <Form.Item<WorkerLabelsFormData>
          name="labels"
          extra={
            batch
              ? intl.formatMessage({ id: 'resources.worker.setLabels.hint' })
              : undefined
          }
          rules={[
            () => ({
              validator(rule, value) {
                if (_.keys(value).length > 0) {
                  if (_.some(_.keys(value), (k: string) => !value[k])) {
                    return Promise.reject(
                      intl.formatMessage(
                        {
                          id: 'common.validate.value'
                        },
                        {
                          name: intl.formatMessage({
                            id: 'resources.form.label'
                          })
                        }
                      )
                    );
                  }
                }
                return Promise.resolve();
              }
            })
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
