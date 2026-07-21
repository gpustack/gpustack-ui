import PluginExtraFields from '@/components/plugin-extra-fields';
import {
  IconFont,
  StatusDot,
  TagsWrapper,
  TemplateCard,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { categoryConfig } from '../../_components/model-tag';
import {
  modelCategories,
  modelCategoriesMap,
  modelSourceMap,
  MyModelsStatusLabelMap,
  MyModelsStatusMap,
  MyModelsStatusValueMap
} from '../config';
import { categoryToPathMap } from '../config/button-actions';
import {
  defaultModelLogo,
  getCategoryLogo,
  getModelLogo
} from '../utils/model-logo';

const CardWrapper = styled.div`
  &:hover {
    .content {
      .btn {
        display: block;
      }
    }
  }
`;

const Dot = styled.span`
  background-color: var(--ant-color-text-quaternary);
  border-radius: 50%;
  flex: none;
  height: 3px;
  width: 3px;
`;

const ModelItemContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: pointer;
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
    width: 100%;
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

const ModelLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: contain;
  flex: none;
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

const renderTag = (item: any, index = 0) => {
  return (
    <ThemeTag key={item} className="tag-item" color="purple">
      {item}
    </ThemeTag>
  );
};

const ModelItem: React.FC<{
  model: Record<string, any>;
  onClick?: (model: Record<string, any>) => void;
}> = (props) => {
  const { model, onClick } = props;
  const intl = useIntl();
  const navigate = useNavigate();

  const handleCardClick = () => {
    onClick?.(model);
  };

  // ``model.name`` from ``/v2/my-models`` is the OpenAI-style id
  // (org-prefixed for non-platform routes, bare for platform). Use it
  // verbatim — the playground / dispatcher both key off that exact id.
  const handleOpenPlayGroundClick = (e: React.MouseEvent) => {
    // Card is clickable (opens API access info); keep the playground
    // action isolated so it doesn't also trigger the card click.
    e.stopPropagation();
    const modelName = encodeURIComponent(model.name);
    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        model.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${modelName}`);
        return;
      }
      if (model.categories?.includes(category)) {
        navigate(`${path}?model=${modelName}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${modelName}`);
  };

  // Logo priority: brand logo matched from the name → tinted category
  // icon (from model_icons) → generic default image.
  const brandLogo = getModelLogo(model.name);
  const categoryLogo = brandLogo ? null : getCategoryLogo(model.categories);

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

    return _.round(max_tokens / 1024);
  }, [model]);

  // Ready is the normal state — show just the dot (no label); other states
  // (Not Ready / Stopped) keep their label so the problem is legible.
  const statusNode = (
    <StatusDot
      statusValue={{
        status: MyModelsStatusMap[model.status],
        text:
          model.status === MyModelsStatusValueMap.Ready ||
          !MyModelsStatusLabelMap[model.status]
            ? ''
            : intl.formatMessage({
                id: MyModelsStatusLabelMap[model.status]
              })
      }}
    />
  );

  return (
    <CardWrapper>
      <TemplateCard
        height={140}
        clickable={true}
        hoverable={true}
        ghost
        onClick={handleCardClick}
        header={
          <Header>
            <span className="text gap-16">
              {brandLogo ? (
                <ModelLogo src={brandLogo} alt="" />
              ) : categoryLogo ? (
                <ModelLogo src={categoryLogo} alt="" />
              ) : (
                <ModelLogo src={defaultModelLogo} alt="" />
              )}
              <span className="flex-center" style={{ gap: 8, minWidth: 0 }}>
                <span>{model.name}</span>
                {/* Status moved to a compact dot right after the name, freeing
                    the header's right side for the price summary. The dot keeps
                    the state message on hover (StatusDot has no built-in one). */}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 'var(--font-size-small)'
                  }}
                >
                  {model.state_message ? (
                    <Tooltip title={model.state_message}>
                      <span style={{ display: 'inline-flex' }}>
                        {statusNode}
                      </span>
                    </Tooltip>
                  ) : (
                    statusNode
                  )}
                </span>
              </span>
            </span>
            <span className="flex-center gap-8">
              <PluginExtraFields name="ModelPriceSummary" context={{ model }} />
            </span>
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
                  <>
                    <Dot></Dot>
                    <ThemeTag className="tag-item" color="purple">
                      {maxToken}K context
                    </ThemeTag>
                  </>
                )}
                {model.meta?.voices?.length > 0 && (
                  <>
                    <Dot></Dot>
                    <TagsWrapper
                      gap={8}
                      dataList={model.meta?.voices}
                      renderTag={renderTag}
                    ></TagsWrapper>
                  </>
                )}
              </div>
              {[MyModelsStatusValueMap.Ready].includes(model.status) && (
                <Button
                  size="middle"
                  type="default"
                  className="btn"
                  style={{
                    borderRadius: 6,
                    paddingInline: 12
                  }}
                  onClick={handleOpenPlayGroundClick}
                >
                  {intl.formatMessage({ id: 'models.openinplayground' })}
                  <IconFont
                    type="icon-down2"
                    rotate={-90}
                    style={{ marginLeft: 4 }}
                  ></IconFont>
                </Button>
              )}
            </div>
          </div>
        </ModelItemContent>
      </TemplateCard>
    </CardWrapper>
  );
};

export default ModelItem;
