import CheckboxField from '@/components/seal-form/checkbox-field';
import TransferInner from '@/pages/_components/transfer';
import { queryUsersList } from '@/pages/users/apis';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import { queryModelAccessUserList } from '../../apis';
import { AccessControlFormData, ListItem } from '../../config/types';

type TransferKey = string | number | bigint;

const Label = styled.div`
  font-weight: 500;
  margin-bottom: 16px;
  margin-top: 16px;
  font-size: 14px;
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
        key: item.id
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
          set_public: res.items.length > 0,
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
        public: true
      }}
    >
      <Form.Item<AccessControlFormData>
        valuePropName="checked"
        name="set_public"
        style={{ marginBottom: 24, paddingLeft: 6 }}
      >
        <CheckboxField
          description="Only authorized users can access"
          label={'Restricted'}
        ></CheckboxField>
      </Form.Item>
      {setPublic && (
        <>
          <Label>User Select</Label>
          <Form.Item<AccessControlFormData>
            name="users"
            rules={[
              {
                required: true,
                message: 'Please select at least one user'
              }
            ]}
          >
            <TransferInner
              total={100}
              dataSource={userList}
              targetKeys={targetKeys}
              showSelectAll
              pagination={false}
              titles={['Available Users', 'Users with Access']}
              showSearch={{
                placeholder: 'Filter by username'
              }}
              render={(item) => item.title}
              selectAllLabels={[]}
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
