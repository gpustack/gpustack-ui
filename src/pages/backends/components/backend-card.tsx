import AutoTooltip from '@/components/auto-tooltip';
import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import TagWrapper from '@/components/tags-wrapper';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import Card from '@/components/templates/card';
import { useIntl } from '@umijs/max';
import { Button, Flex, Tag, Tooltip } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import semverCoerce from 'semver/functions/coerce';
import semverGt from 'semver/functions/gt';
import styled from 'styled-components';
import {
  backendActions,
  BackendSourceLabelMap,
  BackendSourceValueMap,
  builtInBackendLogos,
  customColors,
  customIcons,
  getGpuColor,
  TagColorMap
} from '../config';
import { ListItem } from '../config/types';

const StyledCard = styled(Card)`
  &:hover {
    .operations {
      background-color: var(--ant-color-fill-tertiary);
      border-radius: var(--ant-border-radius);
    }
  }
`;

const SourceWrapper = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: max-content 1fr;
  align-items: center;

  gap: 0px;
  .dot {
    display: flex;
    height: 4px;
    width: 4px;
    background-color: var(--ant-color-text-quaternary);
    border-radius: 50%;
    margin-inline: 8px;
  }
`;

const TagInner = styled(Tag)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  height: 28px;
  width: 28px;
  border-radius: 6px;
  font-weight: 400;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  width: 100%;
  .title {
    display: flex;
    align-items: center;
    gap: 24px;
  }
`;

const CardName = styled.div`
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
  color: var(--ant-color-text);
  margin-bottom: 8px;
  gap: 8px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 12px;
  gap: 8px;
  color: var(--ant-color-text-secondary);
  .description {
    margin-block: 12px;
    color: var(--ant-color-text-tertiary);
  }
  .text {
    margin-left: 4px;
    color: var(--ant-color-text);
  }
  .title {
    color: var(--ant-color-text);
    font-weight: 500;
    line-height: 1.5;
  }
  .info {
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: center;
    gap: 8px;
    color: var(--ant-color-text-tertiary);
    .icon {
      color: var(--ant-color-text-tertiary);
    }
    .label {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
`;

const InfoItem = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: max-content 1fr minmax(0, max-content);
  align-items: center;
  gap: 8px;
  color: var(--ant-color-text-tertiary);
  .icon {
    color: var(--ant-color-text-quaternary);
  }
  .label {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

interface BackendCardProps {
  onClick?: (data: any) => void;
  onSelect?: (item: any) => void;
  data: ListItem;
}

const BackendCard: React.FC<BackendCardProps> = ({ data, onSelect }) => {
  const intl = useIntl();

  const handleOnSelect = (item: any) => {
    onSelect?.({ action: item.key, data: data });
  };

  const handleClick = () => {
    onSelect?.({ action: 'view_versions', data: data });
  };

  const renderIcon = () => {
    if (builtInBackendLogos[data.backend_name]) {
      return <img src={builtInBackendLogos[data.backend_name]} height={20} />;
    }
    if (data.icon) {
      return <img src={data.icon} height={20} />;
    }
    const color = customColors[data.id % customColors.length];
    const icon = customIcons[data.id % customIcons.length];

    return (
      <TagInner color={color} variant="filled">
        {icon}
      </TagInner>
    );
  };

  const actions = useMemo(() => {
    return backendActions.filter((item) => {
      if (item.show) {
        return item.show(data);
      }
      return true;
    });
  }, [data.is_built_in]);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const sortVersions = (v2: string, v1: string) => {
    const sv1 = semverCoerce(v1);
    const sv2 = semverCoerce(v2);

    if (!sv1 && !sv2) return 0;
    if (!sv1) return 1;
    if (!sv2) return -1;

    if (semverGt(sv1, sv2)) return -1;
    return 1;
  };

  const renderTag = (item: any) => {
    return (
      <AutoTooltip
        ghost
        minWidth={20}
        showTitle
        title={
          _.join(data.framework_index_map?.[item].sort(sortVersions), ', ') ||
          false
        }
      >
        <ThemeTag
          key={item}
          style={{ marginRight: 0 }}
          color={getGpuColor(item)}
        >
          {item}
        </ThemeTag>
      </AutoTooltip>
    );
  };

  const renderModel = (item: any) => {
    return (
      <AutoTooltip ghost minWidth={20} showTitle title={item}>
        <ThemeTag key={item} style={{ marginRight: 0 }}>
          {item}
        </ThemeTag>
      </AutoTooltip>
    );
  };

  const renderFrameworks = () => {
    const frameworks = _.keys(data.framework_index_map || {});

    return (
      <InfoItem>
        <span className="label">
          <IconFont className="icon" type="icon-gpu1" />
          <span>
            {intl.formatMessage({ id: 'backend.availableFrameworks' })}:{' '}
          </span>
        </span>
        <TagWrapper
          gap={8}
          dataList={frameworks}
          renderTag={renderTag}
        ></TagWrapper>
      </InfoItem>
    );
  };

  const renderRecommendModels = () => {
    const recommendedModels = data.recommend_models || [];
    if (recommendedModels.length === 0) {
      return null;
    }
    return (
      <div className="flex-center">
        <span className="dot"></span>
        <Tooltip
          title={
            <Flex gap={4} wrap="wrap">
              {recommendedModels.map((item) => (
                <Tag style={{ margin: 0 }} key={item}>
                  {item}
                </Tag>
              ))}
            </Flex>
          }
        >
          <span>
            <ThemeTag color="default">
              {intl.formatMessage({ id: 'backend.recommendModels' })}
            </ThemeTag>
          </span>
        </Tooltip>
      </div>
    );
  };

  const renderSource = () => {
    const source = data.is_built_in
      ? BackendSourceLabelMap[BackendSourceValueMap.BUILTIN] || ''
      : BackendSourceLabelMap[data.backend_source] || '';
    if (!source) {
      return null;
    }
    return (
      <ThemeTag
        color={
          TagColorMap[
            data.is_built_in
              ? BackendSourceValueMap.BUILTIN
              : data.backend_source
          ]
        }
        className="font-400"
        variant="outlined"
        style={{
          borderRadius: 'var(--ant-border-radius)',
          margin: 0,
          width: 'max-content'
        }}
      >
        {intl.formatMessage({
          id: source
        })}
      </ThemeTag>
    );
  };

  const renderEnabledTag = () => {
    if (data.backend_source !== BackendSourceValueMap.COMMUNITY) {
      return null;
    }
    return (
      <ThemeTag
        className="font-400"
        variant="outlined"
        color={data.enabled ? 'green' : 'default'}
        style={{
          borderRadius: 'var(--ant-border-radius)',
          margin: 0,
          width: 'max-content'
        }}
      >
        {data.enabled
          ? `${intl.formatMessage({ id: 'common.status.enabled' })}`
          : `${intl.formatMessage({ id: 'common.status.disabled' })}`}
      </ThemeTag>
    );
  };

  return (
    <StyledCard
      onClick={handleClick}
      clickable={true}
      hoverable={true}
      disabled={false}
      height={164}
      ghost
      header={
        <Header>
          <div className="title">{renderIcon()}</div>
          <span onClick={onClick} className="operations">
            <DropDownActions
              menu={{
                items: actions,
                onClick: handleOnSelect
              }}
            >
              <Button
                icon={<IconFont type="icon-more"></IconFont>}
                size="small"
                type="text"
              ></Button>
            </DropDownActions>
          </span>
        </Header>
      }
    >
      <Content>
        <CardName>
          <span>{data.backend_name}</span>
        </CardName>
        <SourceWrapper>
          <InfoItem>
            <span className="label">
              <IconFont type="icon-source" className="icon" />
              <span>{intl.formatMessage({ id: 'models.form.source' })}:</span>
            </span>
            {renderSource()}
            {renderEnabledTag()}
          </InfoItem>
          {renderRecommendModels()}
        </SourceWrapper>
        {renderFrameworks()}
      </Content>
    </StyledCard>
  );
};

export default BackendCard;
