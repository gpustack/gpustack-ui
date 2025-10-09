import ScrollerModal from '@/components/scroller-modal';
import { Form } from 'antd';
import { useEffect } from 'react';
import BuiltinVersions from '../forms/built-in-versions';

interface ViewBuiltinVersionsModalProps {
  open?: boolean;
  currentData?: any;
  onClose?: () => void;
}

const ViewBuiltinVersionsModal: React.FC<ViewBuiltinVersionsModalProps> = ({
  open,
  currentData,
  onClose
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && currentData) {
      const builtInVersions = Object.keys(
        currentData.build_in_version_configs || {}
      ).map((key) => ({
        version_no: key,
        image_name: currentData.build_in_version_configs[key].image_name,
        run_command: currentData.build_in_version_configs[key].run_command,
        is_default: key === currentData.default_version,
        build_in_frameworks:
          currentData.build_in_version_configs[key].build_in_frameworks || [],
        is_built_in: true
      }));
      form.setFieldsValue({
        build_in_version_configs: builtInVersions
      });
    }
  }, [open, currentData, form]);

  return (
    <ScrollerModal
      open={open}
      style={{
        top: '20%'
      }}
      title="View Built-in Versions"
      width={550}
      destroyOnHidden
      closable={true}
      maskClosable={false}
      onOk={onClose}
      onCancel={onClose}
      styles={{
        content: {
          padding: '0 0 16px 0'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '16px 24px 32px'
        },
        footer: {
          padding: '16px 24px',
          margin: '0'
        }
      }}
      footer={null}
    >
      <Form form={form}>
        <BuiltinVersions />
      </Form>
    </ScrollerModal>
  );
};

export default ViewBuiltinVersionsModal;
