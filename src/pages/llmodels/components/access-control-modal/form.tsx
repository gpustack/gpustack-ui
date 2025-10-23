import AlertBlockInfo from '@/components/alert-info/block';
import TransferInner from '@/pages/_components/transfer';
import { queryUsersList } from '@/pages/users/apis';
import { useIntl } from '@umijs/max';
import { Empty, Form, Radio } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import { queryModelAccessUserList } from '../../apis';
import { AccessControlFormData, ListItem } from '../../config/types';

type TransferKey = string | number | bigint;

const Label = styled.div`
  font-weight: 500;
  margin-block: 8px 12px;
  font-size: 14px;
  color: var(--ant-color-text-tertiary);
`;

interface AccessControlFormProps {
  currentData?: ListItem | null;
  onFinish: (values: AccessControlFormData) => void;
}

const AccessControlForm = forwardRef((props: AccessControlFormProps, ref) => {
  const { currentData, onFinish } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const accessPolicy = Form.useWatch('access_policy', form);
  const [targetKeys, setTargetKeys] = useState<TransferKey[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [userList, setUserList] = useState<{ title: string; key: number }[]>(
    []
  );
  const [queryParams, setQueryParams] = useState<Global.SearchParams>({
    page: 1,
    perPage: 100
  });

  const getUserList = async (query: Global.SearchParams) => {
    try {
      const res = await queryUsersList(query);
      const options = res.items.map((item) => ({
        title: item.username,
        key: item.id,
        is_admin: item.is_admin
      }));
      setTotalPages(res.pagination.totalPage);
      setUserList(options);
    } catch (error) {
      setUserList([]);
    }
  };

  const handleOnChange = (
    nextTargetKeys: TransferKey[],
    direction: string,
    removeKeys: TransferKey[]
  ) => {
    setTargetKeys(nextTargetKeys);
    const users = nextTargetKeys.map((key) => ({ id: key }));
    form.setFieldsValue({ users });
  };

  const onSearch = (dir: 'left' | 'right', value: string) => {
    console.log('search:', dir, value);
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
    if (currentData?.id) {
      queryModelAccessUserList(currentData.id).then((res) => {
        const keys = res.items.map((item) => item.id);
        setTargetKeys(keys);
        form.setFieldsValue({
          access_policy: currentData.access_policy,
          users: res.items.map((item) => ({ id: item.id }))
        });
      });
    } else {
      setTargetKeys([]);
      form.setFieldsValue({ users: [] });
    }
    getUserList(queryParams);
  }, [currentData?.id]);

  return (
    <Form
      form={form}
      onFinish={onFinish}
      preserve={false}
      clearOnDestroy={true}
      scrollToFirstError={true}
      initialValues={{
        access_policy: 'authed'
      }}
    >
      <Label>{intl.formatMessage({ id: 'models.table.accessScope' })}</Label>
      <Form.Item<AccessControlFormData> name="access_policy" noStyle>
        <Radio.Group
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
          </Label>
          <Form.Item<AccessControlFormData> name="users">
            <TransferInner
              dataSource={userList}
              targetKeys={targetKeys}
              pagination={false}
              titles={[
                intl.formatMessage({ id: 'models.table.users.all' }),
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
                    {item.is_admin
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
