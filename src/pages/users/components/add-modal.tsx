import { PageAction, PasswordReg } from '@/config';
import { PageActionType } from '@/config/types';
import useSubmitLock from '@/hooks/use-submit-lock';
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
import {
  AuthSourceOptions,
  AuthSources,
  UserRoles,
  UserRolesOptions
} from '../config';
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
  const { loading, guard, run, release } = useSubmitLock();
  const selectedSource = Form.useWatch('source', form) ?? AuthSources.LOCAL;
  const existingSource = data?.source ?? AuthSources.LOCAL;
  // Local is the only source that uses a local password row. For an
  // existing SSO user (or a brand-new SSO row at create time) the
  // password field is hidden entirely.
  const showPassword = selectedSource === AuthSources.LOCAL;
  // Password is required when there's no usable credential after
  // submit: create-Local always, or edit-Local that is *switching*
  // from an SSO source (the backend rejects SSO → Local without a
  // fresh password to avoid locking the user out of /login). Editing
  // a user who was already Local can leave it blank.
  const passwordRequired =
    showPassword &&
    (action === PageAction.CREATE || existingSource !== AuthSources.LOCAL);
  // Switching the source is a sensitive operation — surface the
  // consequence to the admin so they're not surprised that flipping
  // to an IdP silently invalidates the user's local password.
  const sourceSwitchTipId =
    action === PageAction.EDIT && selectedSource !== existingSource
      ? selectedSource === AuthSources.LOCAL
        ? 'users.form.source.tip.switchToLocal'
        : 'users.form.source.tip.switchToExternal'
      : null;

  const initFormValue = () => {
    if (action === PageAction.EDIT && open) {
      form.setFieldsValue({
        ...data,
        is_admin: data?.is_admin ? UserRoles.ADMIN : UserRoles.USER,
        is_active: !!data?.is_active,
        source: data?.source || AuthSources.LOCAL
      });
    } else if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        is_admin: UserRoles.USER,
        is_active: true,
        source: AuthSources.LOCAL
      });
    }
  };

  const handleSubmit = () => {
    guard(() => form.submit());
  };

  const onFinish = async (values: FormData) => {
    await run(() => onOk(values));
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
      loading={loading}
    >
      <Form
        name="addUserForm"
        form={form}
        onFinish={onFinish}
        onFinishFailed={release}
        preserve={false}
      >
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
          name="source"
          rules={[{ required: false }]}
          // The select always carries a value (initialised to the
          // user's current source), so the dropdown alone doesn't
          // signal intent — ``sourceSwitchTipId`` adds an inline
          // explanation of the side effect whenever the selected
          // value diverges from the stored one.
          extra={
            sourceSwitchTipId
              ? intl.formatMessage({ id: sourceSwitchTipId })
              : undefined
          }
        >
          <SealSelect
            label={intl.formatMessage({ id: 'users.form.source' })}
            // Self-edit guard: flipping your own row to an external
            // source clears your own local password — if SSO is
            // misconfigured or the IdP can't reach you, that locks
            // you out of /login with no recovery path.
            disabled={
              !!data?.id &&
              data.id === initialState?.currentUser?.id &&
              action === PageAction.EDIT
            }
            options={AuthSourceOptions}
          ></SealSelect>
        </Form.Item>

        {showPassword && (
          <Form.Item<FormData>
            name="password"
            rules={[
              {
                required: passwordRequired,
                pattern: PasswordReg,
                message: intl.formatMessage({ id: 'users.form.rule.password' })
              }
            ]}
          >
            <CInput.Password
              autoComplete={'new-password'}
              label={intl.formatMessage({ id: 'common.form.password' })}
              required={passwordRequired}
              onPressEnter={handleSubmit}
            ></CInput.Password>
          </Form.Item>
        )}
      </Form>
    </FormDrawer>
  );
};

export default AddModal;
