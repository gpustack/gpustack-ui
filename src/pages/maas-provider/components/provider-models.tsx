import AutoTooltip from '@/components/auto-tooltip';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Flex, Tag } from 'antd';
import _ from 'lodash';
import React from 'react';
import { categoryConfig } from '../../_components/model-tag';
import { ProviderModel } from '../config/types';

interface ProviderModelProps {
  dataList: ProviderModel[];
}

const ProviderModels: React.FC<ProviderModelProps> = ({ dataList }) => {
  const iconsMap = {
    accessible: <CheckCircleOutlined />,
    inaccessible: <CloseCircleOutlined />,
    none: <WarningOutlined />
  };
  return (
    <Flex gap="8px" wrap="wrap">
      {dataList.map((model) => (
        <Tag
          key={model.name}
          icon={
            _.isBoolean(model.accessible)
              ? iconsMap[model.accessible ? 'accessible' : 'inaccessible']
              : iconsMap['none']
          }
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
            model.accessible === true
              ? 'success'
              : model.accessible === false
                ? 'error'
                : 'warning'
          }
        >
          <span className="flex-center">
            <AutoTooltip ghost maxWidth={'120px'}>
              {model.name}
            </AutoTooltip>
            <span style={{ marginLeft: 8 }}>
              {categoryConfig[model.category]?.icon}
            </span>
          </span>
        </Tag>
      ))}
    </Flex>
  );
};

export default ProviderModels;
