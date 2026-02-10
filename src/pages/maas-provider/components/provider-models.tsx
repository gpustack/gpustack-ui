import AutoTooltip from '@/components/auto-tooltip';
import OverlayScroller from '@/components/overlay-scroller';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Flex, Popover, Tag } from 'antd';
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
    inaccessible: null,
    none: null
  };

  const intl = useIntl();

  const head12Items = dataList.slice(0, 4);
  const restItems = dataList.slice(4);

  const renderModels = (dataList: ProviderModel[]) => {
    return (
      <>
        {dataList.map((model, index) => (
          <Tag
            key={index}
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
              model.accessible === true ? 'var(--ant-color-success)' : 'default'
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
      </>
    );
  };
  return (
    <div>
      <Flex gap="8px" wrap="wrap">
        {renderModels(head12Items)}
        {restItems.length > 0 && (
          <Popover
            placement="right"
            content={
              <OverlayScroller
                maxHeight={420}
                styles={{
                  wrapper: {
                    paddingInlineStart: 0
                  }
                }}
              >
                <Flex gap="8px" wrap="wrap">
                  {renderModels(restItems)}
                </Flex>
              </OverlayScroller>
            }
            styles={{
              root: { maxWidth: '400px' },
              container: {
                paddingInlineEnd: 4
              }
            }}
          >
            <Tag
              variant="outlined"
              styles={{
                root: {
                  width: 'fit-content',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4
                }
              }}
            >
              {intl.formatMessage(
                { id: 'providers.form.more' },
                { count: restItems.length }
              )}
            </Tag>
          </Popover>
        )}
      </Flex>
    </div>
  );
};

export default ProviderModels;
