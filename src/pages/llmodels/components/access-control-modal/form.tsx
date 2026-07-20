import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { RouteItem } from '@/pages/model-routes/config/types';
import { queryUserDirectory } from '@/pages/users/apis';
import { getGPUStackPlugin } from '@/plugins';
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  TooltipList,
  Transfer as TransferInner
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Checkbox,
  Dropdown,
  DropdownProps,
  Empty,
  Flex,
  Form,
  Radio,
  RadioChangeEvent,
  Tooltip
} from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { queryModelAccessUserList } from '../../apis';
import { AccessControlFormData } from '../../config/types';

type TransferKey = string | number | bigint;

// The "specific users" policy is now ALLOWED_PRINCIPALS with a
// user-only grant list — the same value the principal-based override
// (when a plugin provides one) uses, so the two interoperate.
// `allowed_users` is the deprecated value released in v2.1.x; normalize
// it so legacy routes still select the "specific users" radio (they
// converge to ALLOWED_PRINCIPALS on save).
export const ALLOWED_PRINCIPALS_POLICY = 'allowed_principals';
const normalizeAccessPolicy = (p?: string) =>
  p === 'allowed_users' ? ALLOWED_PRINCIPALS_POLICY : p;

const buildAccessScopeTips = (
  override?: AllowedUsersOverride,
  prepended: PrependedPolicy[] = []
) => [
  ...prepended.map((p) => ({
    title: { text: p.labelId, locale: true },
    tips: p.tipsId ?? p.labelId
  })),
  {
    title: {
      text: 'models.accessSettings.authed',
      locale: true
    },
    tips: 'models.accessSettings.authed.tips'
  },
  {
    title: {
      text: override?.labelId ?? 'models.accessSettings.allowedUsers',
      locale: true
    },
    tips: override?.tipsId ?? 'models.accessSettings.allowedUsers.tips'
  },
  {
    title: {
      text: 'models.accessSettings.public',
      locale: true
    },
    tips: 'models.accessSettings.public.desc'
  }
];

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  margin-bottom: 16px;
  font-size: 14px;
`;

interface AccessControlFormProps {
  action: PageActionType;
  currentData?: RouteItem | null;
  onFinish: (values: AccessControlFormData) => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}

// Extension seam: an enterprise plugin can substitute the legacy
// `allowed_users` policy entry with a different one (e.g. the
// principal-based ALLOWED_PRINCIPALS surface). When the override is
// present, the OSS `allowed_users` radio option is swapped out and
// the override's ``Field`` component is rendered when that policy is
// active. Without a plugin the OSS form is unchanged.
type AllowedUsersOverride = {
  policyValue: string;
  labelId: string;
  tipsId?: string;
  Field: React.ComponentType<{
    form: any;
    routeId?: number;
    action: PageActionType;
  }>;
  // Optional trigger (e.g. an "Add" button) rendered by the host in its
  // own layout slot while `Field` renders the body. Same props as Field
  // so the plugin can gate visibility on action/routeId.
  Action?: React.ComponentType<{
    form: any;
    routeId?: number;
    action: PageActionType;
  }>;
};

// Extra policy entries prepended to the radio list (rendered before
// `authed`). Each entry can optionally bring a `Field` that renders
// when its policy is selected — leave it out for plain "scope"
// policies that need no extra config (e.g. ORG).
type PrependedPolicy = {
  policyValue: string;
  labelId: string;
  tipsId?: string;
  Field?: React.ComponentType<{
    form: any;
    routeId?: number;
    action: PageActionType;
  }>;
};

const AccessControlForm = forwardRef((props: AccessControlFormProps, ref) => {
  const { action, currentData, onFinish, onValuesChange } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const accessPolicy = Form.useWatch('access_policy', form);
  const pluginAccessControl = getGPUStackPlugin()?.accessControl;
  const allowedUsersOverride: AllowedUsersOverride | undefined =
    pluginAccessControl?.allowedUsersOverride;
  const overridePolicyValue = allowedUsersOverride?.policyValue;
  const prependedPolicies: PrependedPolicy[] =
    pluginAccessControl?.prependedPolicies ?? [];
  const resolveCreateDefault: (() => string | undefined) | undefined =
    pluginAccessControl?.resolveCreateDefault;
  const activePrependedPolicy = prependedPolicies.find(
    (p) => p.policyValue === accessPolicy
  );
  const [targetKeys, setTargetKeys] = useState<TransferKey[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [userList, setUserList] = useState<
    { title: string; key: number; is_admin: boolean; is_active: boolean }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [filterInUsers, setFilterInUsers] = useState<Set<string>>(new Set());
  const [queryParams, setQueryParams] = useState<Global.SearchParams>({
    page: -1
  });
  const formDataCacheRef = useRef<AccessControlFormData | null>(null);

  const dataList = useMemo(() => {
    if (filterInUsers.size === 0) {
      return userList.filter((user) => {
        return !user.is_admin && user.is_active;
      });
    }
    return userList.filter((user) => {
      const isAdmin = user.is_admin;
      const isActive = user.is_active;
      if (!filterInUsers.has('admin') && isAdmin) {
        return false;
      }
      if (!filterInUsers.has('inactive') && !isActive) {
        return false;
      }
      return true;
    });
  }, [userList, filterInUsers]);

  const getUserList = async (query: Global.SearchParams) => {
    try {
      const res = await queryUserDirectory(query);
      const options = res.items.map((item) => ({
        title: item.username,
        key: item.id,
        is_admin: item.is_admin as boolean,
        is_active: item.is_active as boolean
      }));
      setTotalPages(res.pagination.totalPage);
      setUserList(options);
      return options;
    } catch (error) {
      setUserList([]);
      return [];
    }
  };

  const handleOnChange = async (
    nextTargetKeys: TransferKey[],
    direction: string,
    removeKeys: TransferKey[]
  ) => {
    setTargetKeys(nextTargetKeys);
    const users = nextTargetKeys.map((key) => ({ id: key }));
    form.setFieldsValue({ users });
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    onValuesChange?.({ users }, form.getFieldsValue());
  };

  const onSearch = (dir: 'left' | 'right', value: string) => {
    console.log('search:', dir, value);
  };

  const handleCheck = (e: any, type: string) => {
    const newSet = new Set(filterInUsers);
    if (e.target.checked) {
      newSet.add(type);
    } else {
      newSet.delete(type);
    }
    setFilterInUsers(newSet);
  };

  const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setOpen(nextOpen);
    }
  };

  const handleOnPolicyChange = async (e: RadioChangeEvent) => {
    console.log('policy changed:', e.target.value);
    const policy = e.target.value;
    if (policy === ALLOWED_PRINCIPALS_POLICY) {
      form.setFieldsValue({ users: formDataCacheRef.current?.users || [] });
    } else {
      formDataCacheRef.current = {
        access_policy: policy,
        users: form.getFieldValue('users') || []
      };
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    onValuesChange?.({ access_policy: policy }, form.getFieldsValue());
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      form.submit();
    },
    setFieldsValue: (values: Partial<AccessControlFormData>) => {
      form.setFieldsValue(values);
    },
    getFieldsValue: () => {
      return form.getFieldsValue();
    },
    resetFields: () => {
      form.resetFields();
    }
  }));

  useEffect(() => {
    const init = async () => {
      const allusers = await getUserList(queryParams);
      const userMap = new Map(allusers.map((u) => [u.key, u]));

      if (currentData?.id) {
        // Seed the radio from the parent's snapshot so the form isn't
        // momentarily unselected; the GET below replaces it with the
        // server's authoritative value, which is what survives a save
        // when the parent list hasn't been refreshed.
        form.setFieldsValue({
          access_policy: normalizeAccessPolicy(currentData?.access_policy)
        });
        queryModelAccessUserList(currentData.id).then((res) => {
          // Fall back to the legacy `items` (USER-only) field when an
          // older backend doesn't return `principals` yet.
          const principals =
            res.principals ??
            res.items?.map((item) => ({
              principal_type: 'user',
              principal_id: item.id
            })) ??
            [];
          // Derive the user picker's selection from the unified
          // `principals` set (USER-kind subset), not the deprecated
          // `items` field. `principals` is also kept whole so a save can
          // preserve any non-user grants it doesn't manage.
          const userKeys = principals
            .filter((p) => p.principal_type === 'user')
            .map((p) => p.principal_id);
          setTargetKeys(userKeys);

          let hasAdmin = false;
          let hasInactive = false;

          for (const key of userKeys) {
            const user = userMap.get(key);
            if (!user) continue;
            if (user.is_admin) hasAdmin = true;
            if (!user.is_active) hasInactive = true;
            if (hasAdmin && hasInactive) break;
          }

          const filterSet = new Set<string>();
          if (hasAdmin) filterSet.add('admin');
          if (hasInactive) filterSet.add('inactive');

          setFilterInUsers(filterSet);

          form.setFieldsValue({
            access_policy: normalizeAccessPolicy(
              res.access_policy ?? currentData.access_policy
            ),
            users: userKeys.map((id) => ({ id })),
            // Keep the full grant set: read by the principal-based
            // override Field, and used on save to preserve non-user
            // grants when the user picker submits `principals`.
            principals
          });
        });
      } else {
        setTargetKeys([]);
        form.setFieldsValue({ users: [] });
      }
    };
    init();
  }, [currentData?.id]);

  const renderFilterDropdown = () => {
    return (
      <Dropdown
        open={open}
        onOpenChange={handleOpenChange}
        key="filter-dropdown"
        menu={{
          items: [
            {
              label: (
                <Checkbox
                  checked={filterInUsers.has('admin')}
                  onChange={(e: any) => handleCheck(e, 'admin')}
                >
                  {intl.formatMessage({ id: 'models.table.admin' })}
                </Checkbox>
              ),
              key: '0'
            },
            {
              label: (
                <Checkbox
                  checked={filterInUsers.has('inactive')}
                  onChange={(e: any) => handleCheck(e, 'inactive')}
                >
                  {intl.formatMessage({ id: 'users.status.inactiveAccount' })}
                </Checkbox>
              ),
              key: '1'
            }
          ]
        }}
      >
        <span>
          <span className="m-r-8" style={{ cursor: 'default' }}>
            {intl.formatMessage({
              id: 'models.accessControlModal.includeusers'
            })}
          </span>
          <DownOutlined style={{ fontSize: 12 }} />
        </span>
      </Dropdown>
    );
  };

  return (
    <Form
      form={form}
      // Submit the full field store (getFieldsValue(true)), not just the
      // registered fields onFinish would pass: the principal-based
      // override Field manages `principals` via setFieldsValue without a
      // registered Form.Item, so it would otherwise be dropped on save.
      onFinish={() => onFinish(form.getFieldsValue(true))}
      preserve={true}
      clearOnDestroy={true}
      scrollToFirstError={true}
      initialValues={{
        users: [],
        // For create the plugin (if registered) may supply a context-
        // sensitive default — e.g. routes in a non-platform Org
        // default to the Org-scoped policy. Fall back to `authed`
        // (the OSS default) if the plugin doesn't return a value.
        access_policy:
          action === PageAction.CREATE
            ? (resolveCreateDefault?.() ?? 'authed')
            : undefined
      }}
    >
      <Label>
        {intl.formatMessage({ id: 'models.table.accessScope' })}
        <Tooltip
          title={
            <TooltipList
              list={buildAccessScopeTips(
                allowedUsersOverride,
                prependedPolicies
              )}
            ></TooltipList>
          }
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </Label>

      <Flex
        align="center"
        justify="space-between"
        style={{ marginBottom: 16, height: 40 }}
      >
        <Form.Item<AccessControlFormData> name="access_policy" noStyle>
          <Radio.Group
            onChange={handleOnPolicyChange}
            options={[
              ...prependedPolicies.map((p) => ({
                label: intl.formatMessage({ id: p.labelId }),
                value: p.policyValue
              })),
              {
                label: intl.formatMessage({
                  id: 'models.accessSettings.authed'
                }),
                value: 'authed'
              },
              allowedUsersOverride
                ? {
                    label: intl.formatMessage({
                      id: allowedUsersOverride.labelId
                    }),
                    value: allowedUsersOverride.policyValue
                  }
                : {
                    label: intl.formatMessage({
                      id: 'models.accessSettings.allowedUsers'
                    }),
                    value: ALLOWED_PRINCIPALS_POLICY
                  },
              {
                label: intl.formatMessage({
                  id: 'models.accessSettings.public'
                }),
                value: 'public'
              }
            ]}
          ></Radio.Group>
        </Form.Item>
        {allowedUsersOverride?.Action &&
          accessPolicy === overridePolicyValue && (
            <allowedUsersOverride.Action
              form={form}
              routeId={currentData?.id}
              action={action}
            />
          )}
      </Flex>
      {accessPolicy === 'public' && (
        <div style={{ marginBlock: '16px 12px' }}>
          <AlertBlockInfo
            type="danger"
            message={intl.formatMessage({
              id: 'models.accessSettings.public.tips'
            })}
            overlayScrollerProps={{
              styles: {
                wrapper: {
                  paddingLeft: 0
                }
              }
            }}
          ></AlertBlockInfo>
        </div>
      )}
      {activePrependedPolicy?.Field && (
        <activePrependedPolicy.Field
          form={form}
          routeId={currentData?.id}
          action={action}
        />
      )}
      {allowedUsersOverride && accessPolicy === overridePolicyValue && (
        <allowedUsersOverride.Field
          form={form}
          routeId={currentData?.id}
          action={action}
        />
      )}
      {!allowedUsersOverride && accessPolicy === ALLOWED_PRINCIPALS_POLICY && (
        <>
          <Label>
            {intl.formatMessage({ id: 'models.table.userSelection' })}
            <Tooltip
              title={intl.formatMessage({
                id: 'models.table.userSelection.tips'
              })}
            >
              <QuestionCircleOutlined />
            </Tooltip>
          </Label>
          <Form.Item<AccessControlFormData> name="users">
            <TransferInner
              dataSource={dataList}
              targetKeys={targetKeys}
              pagination={false}
              titles={[
                renderFilterDropdown(),
                intl.formatMessage({
                  id: 'models.table.users.selected'
                })
              ]}
              locale={{
                notFoundContent: [
                  <Empty
                    key="all"
                    description={intl.formatMessage({
                      id: 'models.table.nouserFound'
                    })}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />,
                  <Empty
                    key="selected"
                    description={intl.formatMessage({
                      id: 'models.table.noselected'
                    })}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ]
              }}
              showSearch={{
                placeholder: intl.formatMessage({
                  id: 'common.filter.name'
                })
              }}
              filterOption={(inputValue, item) =>
                item.title.toLowerCase().includes(inputValue.toLowerCase())
              }
              render={(item) => (
                <span className="flex-center gap-4">
                  <span>{item.title}</span>
                  <span className="text-tertiary">
                    {!item.is_active
                      ? `[${intl.formatMessage({ id: 'users.status.inactive' })}]`
                      : item.is_admin
                        ? `[${intl.formatMessage({ id: 'models.table.admin' })}]`
                        : ''}
                  </span>
                </span>
              )}
              onSearch={onSearch}
              onChange={handleOnChange}
            />
          </Form.Item>
        </>
      )}
    </Form>
  );
});

export default AccessControlForm;
