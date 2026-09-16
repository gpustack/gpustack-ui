import PluginExtraFields from '@/components/plugin-extra-fields';
import { getGPUStackPlugin } from '@/plugins';
import {
  DropdownActions,
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
  MyModelsStatusLabelMap,
  MyModelsStatusMap,
  MyModelsStatusValueMap
} from '../config';
import {
  categoryToPathMap,
  myModelActions,
  type MyModelAction
} from '../config/button-actions';
import {
  defaultModelLogo,
  getCategoryLogo,
  getModelLogo
} from '../utils/model-logo';

const CardWrapper = styled.div`
  &:hover {
    .operations {
      background-color: var(--ant-color-fill-tertiary);
      border-radius: var(--ant-border-radius-lg);
    }
  }
  height: 100%;
  .template-card-wrapper {
    min-height: 140px;
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
    flex-direction: column;
    justify-content: flex-end;
    flex: 1;
    /* With a plugin block below the tags the group grows from the top
       instead of hugging the card's bottom edge. */
    &.has-extra {
      justify-content: flex-start;
    }
  }
  .footer {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
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
  // padding-bottom: 16px;
  // border-bottom: 1px solid var(--ant-color-border-secondary);
  .anticon {
    font-size: 16px;
    color: var(--ant-color-text-secondary);
  }
  .text {
    display: flex;
    align-items: center;
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--ant-color-text);
  }
`;

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
  // A plugin may contribute extra card actions (enterprise adds
  // "Pricing", which opens a drawer it owns) via
  // `myModels.useGenerateActions` — same seam as the cluster list's
  // row actions. Without the plugin the menu holds just the built-ins.
  const { useGenerateActions, useExtraVisible } =
    getGPUStackPlugin()?.myModels || {};
  // Whether the plugin's block below the tags actually renders content.
  // Only the plugin can answer (its own context decides), and the host
  // needs it because the layout around the slot changes: with content
  // the group grows from the top, without it the tags hug the card's
  // bottom edge. No plugin, or no answer → nothing there.
  const hasExtra = useExtraVisible?.() ?? false;
  const actionList: MyModelAction[] =
    useGenerateActions?.({ actions: myModelActions }) || myModelActions;
  const actions = actionList.filter((item) =>
    item.show ? item.show(model) : true
  );

  const handleCardClick = () => {
    onClick?.(model);
  };

  // ``model.name`` from ``/v2/my-models`` is the OpenAI-style id
  // (org-prefixed for non-platform routes, bare for platform). Use it
  // verbatim — the playground / dispatcher both key off that exact id.
  const openPlayground = () => {
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

  const handleSelectAction = ({ key }: { key: string }) => {
    const action = actions.find((item) => item.key === key);
    // A plugin action is self-contained (it opens the overlay the
    // plugin owns); built-ins are dispatched by key here.
    if (action?.onClick) {
      action.onClick(model);
      return;
    }
    if (key === 'playground') {
      openPlayground();
    }
  };

  // The card itself is clickable (opens API access info); keep the
  // menu isolated so opening it doesn't also trigger the card click.
  const handleActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        height={'100%'}
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
                {/* Status moved to a compact dot right after the name, leaving
                    the header's right side to the actions menu. The dot keeps
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
            {actions.length > 0 && (
              <span className="operations" onClick={handleActionsClick}>
                <DropdownActions
                  menu={{
                    // Strip the card-side fields before antd sees them:
                    // it treats a menu item's own `onClick` as a click
                    // callback and would fire a plugin action a second
                    // time, with a menu-info arg instead of the model.
                    items: actions.map((item) =>
                      _.omit(item, ['show', 'order', 'onClick'])
                    ),
                    onClick: handleSelectAction
                  }}
                >
                  <Button
                    icon={<IconFont type="icon-more"></IconFont>}
                    size="small"
                    type="text"
                  ></Button>
                </DropdownActions>
              </span>
            )}
          </Header>
        }
      >
        <ModelItemContent>
          <div className={hasExtra ? 'content has-extra' : 'content'}>
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
            </div>
            <PluginExtraFields
              name="ModelPriceSummary"
              context={{
                model,
                styles: {
                  wrapper: {
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--ant-color-border-secondary)'
                  }
                }
              }}
            />
          </div>
        </ModelItemContent>
      </TemplateCard>
    </CardWrapper>
  );
};

export default ModelItem;
