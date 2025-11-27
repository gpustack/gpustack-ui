import AlertBlockInfo from '@/components/alert-info/block';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import TransferInner from '@/pages/_components/transfer';
import { queryUsersList } from '@/pages/users/apis';
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Checkbox,
  Dropdown,
  DropdownProps,
  Empty,
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
import { AccessControlFormData, ListItem } from '../../config/types';

type TransferKey = string | number | bigint;

const accessScopeTips = [
  {
    title: {
      text: 'models.accessSettings.authed',
      locale: true
    },
    tips: 'models.accessSettings.authed.tips'
  },
  {
    title: {
      text: 'models.accessSettings.allowedUsers',
      locale: true
    },
    tips: 'models.accessSettings.allowedUsers.tips'
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
  margin-block: 8px 12px;
  font-size: 14px;
  color: var(--ant-color-text-tertiary);
`;

interface AccessControlFormProps {
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: AccessControlFormData) => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}

const AccessControlForm = forwardRef((props: AccessControlFormProps, ref) => {
  const { action, currentData, onFinish, onValuesChange } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const accessPolicy = Form.useWatch('access_policy', form);
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
      const res = await queryUsersList(query);
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
    if (policy === 'allowed_users') {
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
        form.setFieldsValue({
          access_policy: currentData?.access_policy
        });
        queryModelAccessUserList(currentData.id).then((res) => {
          const keys = res.items.map((item) => item.id);
          setTargetKeys(keys);

          let hasAdmin = false;
          let hasInactive = false;

          for (const key of keys) {
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
            access_policy: currentData.access_policy,
            users: res.items.map((item) => ({ id: item.id }))
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
      onFinish={onFinish}
      preserve={true}
      clearOnDestroy={true}
      scrollToFirstError={true}
      initialValues={{
        users: [],
        access_policy: action === PageAction.CREATE ? 'authed' : undefined
      }}
    >
      <Label>
        {intl.formatMessage({ id: 'models.table.accessScope' })}
        <Tooltip title={<TooltipList list={accessScopeTips}></TooltipList>}>
          <QuestionCircleOutlined />
        </Tooltip>
      </Label>

      <Form.Item<AccessControlFormData> name="access_policy" noStyle>
        <Radio.Group
          onChange={handleOnPolicyChange}
          style={{ marginBottom: 12 }}
          options={[
            {
              label: intl.formatMessage({ id: 'models.accessSettings.authed' }),
              value: 'authed'
            },
            {
              label: intl.formatMessage({
                id: 'models.accessSettings.allowedUsers'
              }),
              value: 'allowed_users'
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
      {accessPolicy === 'public' && (
        <div style={{ marginBlock: '16px 12px' }}>
          <AlertBlockInfo
            type="danger"
            message={intl.formatMessage({
              id: 'models.accessSettings.public.tips'
            })}
          ></AlertBlockInfo>
        </div>
      )}
      {accessPolicy === 'allowed_users' && (
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
