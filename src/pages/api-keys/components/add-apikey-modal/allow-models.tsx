import TransferInner from '@/pages/_components/transfer';
import { queryModelsList } from '@/pages/llmodels/apis';
import { Form } from 'antd';
import { useEffect, useState } from 'react';

const AllowModelsForm: React.FC = () => {
  const form = Form.useFormInstance();
  const targetKeys = Form.useWatch('allowed_model_names', form);
  const [modelList, setModelList] = useState<{ key: string; title: string }[]>(
    []
  );
  const [queryParams, setQueryParams] = useState<Global.SearchParams>({
    page: 1,
    perPage: 100
  });

  const getModelList = async () => {
    try {
      const res = await queryModelsList(queryParams);
      const options = res.items.map((item) => ({
        title: item.name,
        key: item.name
      }));
      setModelList(options);
    } catch (error) {}
  };

  useEffect(() => {
    getModelList();
  }, []);

  return (
    <Form.Item name="allowed_model_names">
      <TransferInner
        dataSource={modelList}
        targetKeys={targetKeys}
        onChange={(nextTargetKeys) => {
          form.setFieldsValue({ allowed_model_names: nextTargetKeys });
        }}
        render={(item) => item.title}
        titles={['Available Models', 'Allowed Models']}
        showSearch={{
          placeholder: 'Filter by model name'
        }}
        filterOption={(inputValue, item) =>
          item.title.toLowerCase().includes(inputValue.toLowerCase())
        }
      ></TransferInner>
    </Form.Item>
  );
};

export default AllowModelsForm;
