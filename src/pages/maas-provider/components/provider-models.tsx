import AutoTooltip from '@/components/auto-tooltip';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Flex, Tag } from 'antd';
import React from 'react';
import { categoryConfig } from '../../_components/model-tag';

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
  },
  {
    name: 'model-5',
    status: 'inaccessible',
    type: modelCategoriesMap.embedding
  },
  {
    name: 'model-6model-6model-6model-6model-6model-6model-6',
    status: 'none',
    type: modelCategoriesMap.image
  },
  {
    name: 'model-7',
    status: 'accessible',
    type: modelCategoriesMap.llm
  }
];

const ProviderModels: React.FC<ProviderModelProps> = () => {
  const iconsMap = {
    accessible: <CheckCircleOutlined />,
    inaccessible: <CloseCircleOutlined />,
    none: <WarningOutlined />
  };
  return (
    <div style={{ paddingInline: 16 }}>
      <Flex gap="8px" wrap="wrap">
        {models.map((model) => (
          <Tag
            key={model.name}
            icon={iconsMap[model.status]}
            variant="outlined"
            styles={{
              root: {
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4
              }
            }}
            color={
              model.status === 'accessible'
                ? 'success'
                : model.status === 'inaccessible'
                  ? 'error'
                  : 'warning'
            }
          >
            <span className="flex-center">
              <AutoTooltip ghost maxWidth={'120px'}>
                {model.name}
              </AutoTooltip>
              <span style={{ marginLeft: 8 }}>
                {categoryConfig[model.type]?.icon}
              </span>
            </span>
          </Tag>
        ))}
      </Flex>
    </div>
  );
};

export default ProviderModels;
