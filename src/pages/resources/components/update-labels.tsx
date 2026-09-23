import {
  Input as CInput,
  LabelSelector,
  ModalFooter,
  ScrollerModal
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
  onOk: (values: FormData) => Promise<void>;
  data: {
    name: string;
    labels: object;
  };
  /**
   * Whether this write lands on a SELECTION rather than on one row.
   *
   * Stated by the caller rather than inferred from `count`, because a
   * selection of exactly one is still a batch: the caller has no `data` to
   * hand over, so inferring from `count > 1` put that case on the
   * single-worker path and rendered a name and a label set that were both
   * undefined.
   */
  batch?: boolean;
  /**
   * How many workers the batch will land on — what the name field shows in
   * place of a name.
   */
  count?: number;
};
interface FormData {
  labels: object;
  name: string;
}

const UpdateLabels: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, data, onOk, batch, count } = props || {};
  const intl = useIntl();
  const [form] = Form.useForm();

  const handleSumit = () => {
    form.submit();
  };

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'resources.button.edit' })}
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
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form
        name="deployModel"
        form={form}
        onFinish={onOk}
        preserve={false}
        clearOnDestroy={true}
        initialValues={{
          name: batch
            ? intl.formatMessage(
                { id: 'resources.worker.setLabels.count' },
                { count }
              )
            : data.name,
          // Empty on a batch: the labels entered here are what every selected
          // worker ends up with, so starting from one of them would be a
          // silent overwrite of the rest.
          labels: batch ? {} : data.labels
        }}
      >
        <Form.Item<FormData> name="name">
          <CInput.Input
            label={intl.formatMessage({
              id: 'common.table.name'
            })}
            disabled
          />
        </Form.Item>
        <Form.Item<FormData>
          name="labels"
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
