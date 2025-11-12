import LabelSelector from '@/components/label-selector';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
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
};
interface FormData {
  labels: object;
  name: string;
}

const UpdateLabels: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel, data, onOk } = props || {};
  const intl = useIntl();
  const [form] = Form.useForm();
  const labels = Form.useWatch('labels', form);

  const handleLabelsChange = (labels: object) => {
    form.setFieldValue('labels', labels);
  };

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
      maskClosable={false}
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
          name: data.name,
          labels: data.labels
        }}
      >
        <Form.Item<FormData> name="name">
          <SealInput.Input
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
            labels={labels}
            btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
            onChange={handleLabelsChange}
          ></LabelSelector>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default UpdateLabels;
