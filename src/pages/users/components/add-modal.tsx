import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import {
  SyncOutlined,
  UserOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { UserRoles, UserRolesOptions } from '../config';
import { FormData, ListItem } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem;
  onCancel: () => void;
};
const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const suffix = (
    <SyncOutlined
      style={{
        fontSize: 16,
        color: '#1677ff'
      }}
    />
  );
  const initFormValue = () => {
    if (action === PageAction.EDIT && open) {
      form.setFieldsValue({
        ...data,
        is_admin: data?.is_admin ? UserRoles.ADMIN : UserRoles.USER
      });
    }
  };

  const handleSumit = () => {
    form.submit();
  };

  useEffect(() => {
    initFormValue();
  }, [open]);

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleSumit}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <Form name="addUserForm" form={form} onFinish={onOk} preserve={false}>
        <Form.Item<FormData>
          name="username"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({ id: 'common.table.name' })
                }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="full_name" rules={[{ required: false }]}>
          <SealInput.Input
            label={intl.formatMessage({ id: 'users.form.fullname' })}
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="is_admin" rules={[{ required: false }]}>
          <SealSelect label={intl.formatMessage({ id: 'users.table.role' })}>
            {UserRolesOptions.map((item) => {
              return (
                <Select.Option value={item.value} key={item.value}>
                  {item.value === UserRoles.ADMIN ? (
                    <UserSwitchOutlined className="size-16" />
                  ) : (
                    <UserOutlined className="size-16" />
                  )}
                  <span className="m-l-5">
                    {intl.formatMessage({ id: item.label })}
                  </span>
                </Select.Option>
              );
            })}
          </SealSelect>
        </Form.Item>

        <Form.Item<FormData>
          name="password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({ id: 'common.form.password' })
                }
              )
            }
          ]}
        >
          <SealInput.Password
            label={intl.formatMessage({ id: 'common.form.password' })}
            required
          ></SealInput.Password>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModal;
