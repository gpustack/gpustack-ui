import IconFont from '@/components/icon-font';
import StatusTag from '@/components/status-tag';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import Card from '@/components/templates/card';
import { Button } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  modelCategories,
  modelSourceMap,
  status
} from '../config';

const ModelItemContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: default;
  .title {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    .anticon {
      font-size: 16px;
      color: var(--ant-color-text-secondary);
    }
    .text {
      display: flex;
      align-items: center;
      font-size: var(--font-size-middle);
      font-weight: 500;
      color: var(--ant-color-text);
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
  .footer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    .btn {
      display: none;
    }
  }
  &:hover {
    .btn {
      display: block;
    }
  }
  .time {
    color: var(--ant-color-text-secondary);
    font-size: var(--font-size-small);
    font-weight: 400;
  }
  .extra-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    .tag-item {
      margin-right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      height: 22px;
      opacity: 0.7;
    }
  }
`;

const sourceIconMap = {
  [modelSourceMap.local_path_value]: 'icon-hard-disk',
  [modelSourceMap.huggingface_value]: 'icon-huggingface',
  [modelSourceMap.modelscope_value]: 'icon-modelscope'
};

const ModelItem: React.FC<{
  model: Record<string, any>;
  onClick: (model: any) => void;
}> = (props) => {
  const { model, onClick } = props;

  return (
    <Card onClick={() => onClick(model)} clickable={false} ghost>
      <ModelItemContent>
        <div className="title">
          <span className="text">
            <IconFont
              type={sourceIconMap[model.source]}
              style={{ marginRight: 8 }}
            />
            <span>{model.name}</span>
          </span>
          <StatusTag
            maxTooltipWidth={400}
            statusValue={{
              status: status[InstanceStatusMap.Running] as any,
              text: InstanceStatusMapValue[InstanceStatusMap.Running],
              message: model.state_message
            }}
          ></StatusTag>
        </div>
        <div className="content">
          <div className="extra-info">
            <ThemeTag className="tag-item" color="blue">
              {_.find(modelCategories, { value: model.categories?.[0] })
                ?.label || model.categories?.[0]}
            </ThemeTag>
            <ThemeTag className="tag-item" color="purple">
              128K context
            </ThemeTag>
          </div>
          <div className="footer">
            <span className="time">
              {dayjs(model.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </span>
            <Button
              size="middle"
              className="btn"
              variant="filled"
              color="default"
            >
              Go to Playground
            </Button>
          </div>
        </div>
      </ModelItemContent>
    </Card>
  );
};

export default ModelItem;
