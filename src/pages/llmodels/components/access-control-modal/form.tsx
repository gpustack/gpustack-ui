import TransferInner from '@/pages/_components/transfer';
import { queryUsersList } from '@/pages/users/apis';
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
  const [form] = Form.useForm();
  const setPublic = Form.useWatch('set_public', form);
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
      console.log('options', options);
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
    console.log('nextTargetKeys', nextTargetKeys);
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
          set_public: currentData.public,
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
        set_public: true
      }}
    >
      <Label>Access Scope</Label>
      <Form.Item<AccessControlFormData> name="set_public" noStyle>
        <Radio.Group
          style={{ marginBottom: 12 }}
          options={[
            { label: 'All users', value: true },
            { label: 'Selected users', value: false }
          ]}
        ></Radio.Group>
      </Form.Item>
      {!setPublic && (
        <>
          <Label>User Selection</Label>
          <Form.Item<AccessControlFormData> name="users">
            <TransferInner
              dataSource={userList}
              targetKeys={targetKeys}
              pagination={false}
              titles={['All Users', 'Selected Users']}
              locale={{
                notFoundContent: [
                  <Empty
                    key="all"
                    description="No users found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />,
                  <Empty
                    key="selected"
                    description="No users selected"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ]
              }}
              showSearch={{
                placeholder: 'Filter by username'
              }}
              filterOption={(inputValue, item) =>
                item.title.toLowerCase().includes(inputValue.toLowerCase())
              }
              render={(item) => (
                <span className="flex-center gap-8">
                  <span>{item.title}</span>
                  <span className="text-tertiary">
                    {item.is_admin ? '(Admin)' : ''}
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
