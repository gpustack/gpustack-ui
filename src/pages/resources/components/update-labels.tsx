import LabelSelector from '@/components/label-selector';
import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import React from 'react';
import SimpleBar from 'simplebar-react';
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
    <Modal
      title={intl.formatMessage({ id: 'resources.button.edit' })}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{
        content: {
          padding: '0px'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0'
        },
        footer: {
          padding: '0 var(--ant-modal-content-padding)'
        }
      }}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <SimpleBar
        style={{
          maxHeight: '550px'
        }}
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
          style={{
            padding: 'var(--ant-modal-content-padding)',
            paddingBlock: 0
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
          <Form.Item<FormData> name="labels">
            <LabelSelector
              label={intl.formatMessage({
                id: 'resources.table.labels'
              })}
              labels={labels}
              btnText="common.button.addLabel"
              onChange={handleLabelsChange}
            ></LabelSelector>
          </Form.Item>
        </Form>
      </SimpleBar>
    </Modal>
  );
};

export default React.memo(UpdateLabels);
