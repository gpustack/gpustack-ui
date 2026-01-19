import { categoryOptions, modelCategoriesMap } from '@/pages/llmodels/config';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Flex, Tag } from 'antd';
import React from 'react';

interface ProviderModelProps {
  dataList: any[];
  provider: string;
  providerId: number;
}

const models: {
  name: string;
  status: 'accessible' | 'inaccessible' | 'none';
  type: string;
}[] = [
  {
    name: 'model-1',
    status: 'accessible',
    type: modelCategoriesMap.llm
  },
  {
    name: 'model-2',
    status: 'inaccessible',
    type: modelCategoriesMap.embedding
  },
  {
    name: 'model-3',
    status: 'none',
    type: modelCategoriesMap.image
  },
  {
    name: 'model-4',
    status: 'accessible',
    type: modelCategoriesMap.llm
  }
];

const ProviderModels: React.FC<ProviderModelProps> = () => {
  const iconsMap = {
    accessible: <CheckCircleOutlined />,
    inaccessible: <CloseCircleOutlined />,
    none: <ExclamationCircleOutlined />
  };
  return (
    <div style={{ paddingInline: 16 }}>
      <Flex gap="8px" wrap="wrap">
        {models.map((model) => (
          <Tag
            key={model.name}
            icon={iconsMap[model.status]}
            color={
              model.status === 'accessible'
                ? 'success'
                : model.status === 'inaccessible'
                  ? 'red'
                  : 'gray'
            }
          >
            {model.name} (
            {categoryOptions.find((item) => item.value === model.type)?.label})
          </Tag>
        ))}
      </Flex>
    </div>
  );
};

export default ProviderModels;
