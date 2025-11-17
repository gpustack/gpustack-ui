import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
import SealTextArea from '@/components/seal-form/seal-textarea';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import React from 'react';
import { updateWorker } from '../apis';
import { ListItem } from '../config/types';

const useWorkerMaintenance = ({ fetchData }: { fetchData: () => void }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [openStatus, setOpenStatus] = React.useState<{
    open: boolean;
    currentData: ListItem;
  }>({
    open: false,
    currentData: {} as ListItem
  });

  const handleSumit = () => {
    form.submit();
  };

  const onCancel = () => {
    setOpenStatus({
      open: false,
      currentData: {} as ListItem
    });
  };

  const onOk = async (values: any) => {
    try {
      await updateWorker(openStatus.currentData.id, {
        name: openStatus.currentData.name,
        labels: openStatus.currentData.labels,
        maintenance: {
          enabled: true,
          message: values.remark
        }
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      fetchData();
      onCancel();
    } catch (error) {}
  };

  const handleStopMaintenance = async (row: ListItem) => {
    try {
      await updateWorker(row.id, {
        name: row.name,
        labels: row.labels,
        maintenance: {
          enabled: false,
          message: ''
        }
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      fetchData();
      onCancel();
    } catch (error) {}
  };

  const MaintenanceModal = (
    <ScrollerModal
      title={intl.formatMessage({ id: 'resources.worker.maintenance.title' })}
      open={openStatus.open}
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
        form={form}
        onFinish={onOk}
        preserve={false}
        clearOnDestroy={true}
        initialValues={{
          name: openStatus.currentData.name
        }}
      >
        <Form.Item name="name">
          <SealInput.Input
            label={intl.formatMessage({
              id: 'common.table.name'
            })}
            disabled
          />
        </Form.Item>
        <Form.Item
          name="remark"
          rules={[
            {
              required: false,
              message: intl.formatMessage({
                id: 'resources.worker.maintenance.remark.rules'
              })
            }
          ]}
        >
          <SealTextArea
            label={intl.formatMessage({
              id: 'resources.worker.maintenance.remark'
            })}
            description={intl.formatMessage({
              id: 'resources.worker.maintenance.tips'
            })}
            autoSize={{ minRows: 4, maxRows: 6 }}
          ></SealTextArea>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );

  return {
    MaintenanceModal,
    handleStopMaintenance,
    setOpenStatus
  };
};

export default useWorkerMaintenance;
