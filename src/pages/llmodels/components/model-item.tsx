import IconFont from '@/components/icon-font';
import StatusTag from '@/components/status-tag';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import Card from '@/components/templates/card';
import { StatusMaps } from '@/config';
import { useIntl, useNavigate } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { modelCategories, modelCategoriesMap, modelSourceMap } from '../config';
import { categoryToPathMap } from '../config/button-actions';
import { categoryConfig } from './model-tag';

const MyModelsStatusValueMap = {
  Inactive: 'Inactive',
  Starting: 'Starting',
  Degrade: 'Degrade',
  Active: 'Active'
};

const MyModelsStatusMap = {
  [MyModelsStatusValueMap.Inactive]: StatusMaps.inactive,
  [MyModelsStatusValueMap.Starting]: StatusMaps.transitioning,
  [MyModelsStatusValueMap.Degrade]: StatusMaps.warning,
  [MyModelsStatusValueMap.Active]: StatusMaps.success
};

const CardWrapper = styled.div`
  &:hover {
    .content {
      .btn {
        display: block;
      }
    }
  }
`;

const ModelItemContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: default;
  .content {
    display: flex;
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

  .time {
    color: var(--ant-color-text-secondary);
    font-size: var(--font-size-small);
    font-weight: 400;
  }
  .extra-info {
    display: flex;
    align-items: center;
    gap: 8px;
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

const Header = styled.div`
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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
`;

const sourceIconMap = {
  [modelSourceMap.local_path_value]: 'icon-hard-disk',
  [modelSourceMap.huggingface_value]: 'icon-huggingface',
  [modelSourceMap.modelscope_value]: 'icon-tu2'
};

const ModelItem: React.FC<{
  model: Record<string, any>;
  onClick: (model: any) => void;
}> = (props) => {
  const { model, onClick } = props;
  const intl = useIntl();
  const navigate = useNavigate();

  const handleOpenPlayGround = () => {
    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        model.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${model.name}`);
        return;
      }
      if (model.categories?.includes(category)) {
        navigate(`${path}?model=${model.name}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${model.name}`);
  };

  // context length
  const maxToken = useMemo(() => {
    const meta = model.meta || {};
    const { max_model_len, n_ctx, n_slot, max_total_tokens } = meta || {};

    let max_tokens: number = 0;

    if (n_ctx && n_slot) {
      max_tokens = _.divide(n_ctx, n_slot);
    } else if (max_model_len) {
      max_tokens = max_model_len;
    } else if (max_total_tokens) {
      max_tokens = max_total_tokens;
    }

    return max_tokens / 1024;
  }, [model]);

  const status = useMemo(() => {
    if (!model.replicas && !model.ready_replicas) {
      return MyModelsStatusValueMap.Inactive;
    }
    if (model.replicas > 0 && !model.ready_replicas) {
      return MyModelsStatusValueMap.Starting;
    }
    if (model.replicas > 1 && model.replicas !== model.ready_replicas) {
      return MyModelsStatusValueMap.Degrade;
    }
    if (model.replicas === model.ready_replicas && model.replicas > 0) {
      return MyModelsStatusValueMap.Active;
    }
    return MyModelsStatusValueMap.Inactive;
  }, [model]);

  return (
    <CardWrapper>
      <Card
        height={140}
        onClick={() => onClick(model)}
        clickable={false}
        hoverable={true}
        ghost
        header={
          <Header>
            <span className="text">
              <IconFont
                type={sourceIconMap[model.source]}
                style={{ marginRight: 8, fontSize: 24 }}
              />
              <span>{model.name}</span>
            </span>
            <StatusTag
              maxTooltipWidth={400}
              statusValue={{
                status: MyModelsStatusMap[status],
                text: status,
                message: model.state_message
              }}
            ></StatusTag>
          </Header>
        }
      >
        <ModelItemContent>
          <div className="content">
            <div className="footer">
              <div className="extra-info">
                {model.categories?.length > 0 &&
                  model.categories.map((sItem: string) => {
                    return (
                      <ThemeTag
                        icon={categoryConfig[sItem]?.icon}
                        key={sItem}
                        className="tag-item"
                        color={categoryConfig[sItem]?.color || 'blue'}
                        opacity={0.7}
                      >
                        {_.find(modelCategories, { value: sItem })?.label ||
                          sItem}
                      </ThemeTag>
                    );
                  })}
                {maxToken > 0 && (
                  <ThemeTag className="tag-item" color="purple">
                    {maxToken}K context
                  </ThemeTag>
                )}
              </div>
              {[
                MyModelsStatusValueMap.Active,
                MyModelsStatusValueMap.Degrade
              ].includes(status) && (
                <Button
                  size="middle"
                  className="btn"
                  type="primary"
                  onClick={handleOpenPlayGround}
                >
                  {intl.formatMessage({ id: 'models.openinplayground' })}
                </Button>
              )}
            </div>
          </div>
        </ModelItemContent>
      </Card>
    </CardWrapper>
  );
};

export default ModelItem;
