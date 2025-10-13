import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import SelectPanel from '@/pages/_components/select-panel';
import { queryModelsList } from '@/pages/llmodels/apis';
import { Divider, Form, Radio } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ListItem } from '../../config/types';

const Label = styled.div`
  font-weight: 500;
  margin-block: -8px 12px;
  font-size: 14px;
  margin-left: 4px;
`;

const AllowModelsForm: React.FC<{
  currentData?: Partial<ListItem> | null;
  action: PageActionType;
}> = ({ currentData, action }) => {
  const form = Form.useFormInstance();
  const allowedModelNames = Form.useWatch(
    'allowed_model_names',
    form
  ) as string[];
  const allowedType = Form.useWatch('allowed_type', form);
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
      const options = res.items.map((item) => item.name);
      if (action === PageAction.EDIT && currentData) {
        const list = new Set([
          ...options,
          ...(currentData.allowed_model_names?.map((item) => item) || [])
        ]);
        setModelList(
          Array.from(list).map((item) => ({ key: item, title: item }))
        );
      } else {
        setModelList(options.map((item) => ({ key: item, title: item })));
      }
    } catch (error) {}
  };

  useEffect(() => {
    getModelList();
  }, [action, currentData]);

  return (
    <div>
      <Divider></Divider>
      <Label>Model Access</Label>
      <Form.Item
        name="allowed_type"
        initialValue="all"
        style={{ marginBottom: 8 }}
      >
        <Radio.Group
          options={[
            { label: 'All models', value: 'all' },
            { label: 'Selected models', value: 'custom' }
          ]}
        ></Radio.Group>
      </Form.Item>
      <Form.Item name="allowed_model_names" hidden={allowedType === 'all'}>
        <SelectPanel
          height={300}
          searchPlaceholder="Search by model name"
          options={modelList}
          selectedKeys={allowedModelNames || []}
          onSelectChange={(selectedKeys) => {
            form.setFieldsValue({ allowed_model_names: selectedKeys });
          }}
        />
      </Form.Item>
    </div>
  );
};

export default AllowModelsForm;
