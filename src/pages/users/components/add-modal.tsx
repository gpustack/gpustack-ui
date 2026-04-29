import { PageAction, PasswordReg } from '@/config';
import { PageActionType } from '@/config/types';
import {
  Input as CInput,
  FormDrawer,
  IconFont,
  Select as SealSelect,
  Switch as SealSwitch
} from '@gpustack/core-ui';
import { useIntl, useModel } from '@umijs/max';
import { Form, Select } from 'antd';
import { useEffect } from 'react';
import { UserRoles, UserRolesOptions } from '../config';
import { FormData, ListItem } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
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
  const { initialState } = useModel('@@initialState') || {};
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

  const handleSubmit = () => {
    form.submit();
  };

  useEffect(() => {
    initFormValue();
  }, [open]);

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={onCancel}
      onSubmit={handleSubmit}
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
          <CInput.Input
            autoComplete="off"
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
          ></CInput.Input>
        </Form.Item>
        <Form.Item<FormData> name="full_name" rules={[{ required: false }]}>
          <CInput.Input
            trim={false}
            label={intl.formatMessage({ id: 'users.form.fullname' })}
          ></CInput.Input>
        </Form.Item>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Form.Item<FormData> name="is_admin" rules={[{ required: false }]}>
              <SealSelect
                label={intl.formatMessage({ id: 'users.table.role' })}
                disabled={
                  data?.id === initialState?.currentUser?.id &&
                  action === PageAction.EDIT
                }
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
          {(data?.id !== initialState?.currentUser?.id ||
            action === PageAction.CREATE) && (
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
          )}
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
          <CInput.Password
            autoComplete={'new-password'}
            label={intl.formatMessage({ id: 'common.form.password' })}
            required={action === PageAction.CREATE}
          ></CInput.Password>
        </Form.Item>
      </Form>
    </FormDrawer>
  );
};

export default AddModal;
