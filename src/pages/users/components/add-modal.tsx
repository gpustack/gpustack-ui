import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import SealSwitch from '@/components/seal-form/seal-switch';
import { PageAction, PasswordReg } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form, Select } from 'antd';
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

  const initFormValue = () => {
    if (action === PageAction.EDIT && open) {
      form.setFieldsValue({
        ...data,
        is_admin: data?.is_admin ? UserRoles.ADMIN : UserRoles.USER,
        is_active: !!data?.is_active
      });
    } else if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        is_admin: UserRoles.USER,
        is_active: true
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
    <ScrollerModal
      title={title}
      open={open}
      centered={true}
      onOk={handleSumit}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
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
            trim={false}
            label={intl.formatMessage({ id: 'users.form.fullname' })}
          ></SealInput.Input>
        </Form.Item>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Form.Item<FormData> name="is_admin" rules={[{ required: false }]}>
              <SealSelect
                label={intl.formatMessage({ id: 'users.table.role' })}
              >
                {UserRolesOptions.map((item) => {
                  return (
                    <Select.Option value={item.value} key={item.value}>
                      {item.value === UserRoles.ADMIN ? (
                        <IconFont
                          type="icon-manage_user"
                          className="size-16"
                        ></IconFont>
                      ) : (
                        <IconFont
                          type="icon-user"
                          className="size-16"
                        ></IconFont>
                      )}
                      <span className="m-l-5">
                        {intl.formatMessage({ id: item.label })}
                      </span>
                    </Select.Option>
                  );
                })}
              </SealSelect>
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item<FormData>
              name="is_active"
              rules={[{ required: false }]}
              valuePropName="checked"
            >
              <SealSwitch
                label={intl.formatMessage({ id: 'users.form.active' })}
                description={intl.formatMessage({
                  id: 'users.form.active.description'
                })}
              />
            </Form.Item>
          </div>
        </div>

        <Form.Item<FormData>
          name="password"
          rules={[
            {
              required: action === PageAction.CREATE,
              pattern: PasswordReg,
              message: intl.formatMessage({ id: 'users.form.rule.password' })
            }
          ]}
        >
          <SealInput.Password
            label={intl.formatMessage({ id: 'common.form.password' })}
            required={action === PageAction.CREATE}
          ></SealInput.Password>
        </Form.Item>
      </Form>
    </ScrollerModal>
  );
};

export default AddModal;
