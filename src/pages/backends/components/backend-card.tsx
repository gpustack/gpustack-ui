import AutoTooltip from '@/components/auto-tooltip';
import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import TagWrapper from '@/components/tags-wrapper';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import Card from '@/components/templates/card';
import { useIntl } from '@umijs/max';
import { Button, Tag } from 'antd';
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

// add height props
const TagInner = styled(Tag)<{ height?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  height: ${({ height }) => (height ? `${height}px` : '28px')};
  width: ${({ height }) => (height ? `${height}px` : '28px')};
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
  align-items: end;
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
  actionsRenderer?: (data: ListItem) => React.ReactNode;
  data: ListItem;
  layout?: 'default' | 'community';
  active?: boolean;
}

export const generateIcon = (data: ListItem, height?: number) => {
  const innHeight = height || 20;
  if (builtInBackendLogos[data.backend_name]) {
    return (
      <img src={builtInBackendLogos[data.backend_name]} height={innHeight} />
    );
  }
  if (data.icon) {
    return <img src={data.icon} height={innHeight} />;
  }
  const color = customColors[data.id % customColors.length];
  const icon = customIcons[data.id % customIcons.length];

  return (
    <TagInner color={color} variant="filled" height={height || 28}>
      {icon}
    </TagInner>
  );
};

const BackendCard: React.FC<BackendCardProps> = ({
  data,
  onClick,
  onSelect,
  actionsRenderer,
  layout = 'default',
  active
}) => {
  const intl = useIntl();

  const handleOnSelect = (item: any) => {
    onSelect?.({ action: item.key, data: data });
  };

  const handleClick = () => {
    onSelect?.({ action: 'view_versions', data: data });
    onClick?.(data);
  };

  const renderIcon = () => {
    return generateIcon(data);
  };

  const actions = useMemo(() => {
    return backendActions.filter((item) => {
      if (item.show) {
        return item.show(data);
      }
      return true;
    });
  }, [data]);

  const handleonClickAction = (e: React.MouseEvent) => {
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

  const renderSource = () => {
    if (layout === 'community') {
      return null;
    }
    const source = data.is_built_in
      ? BackendSourceLabelMap[BackendSourceValueMap.BUILTIN] || ''
      : BackendSourceLabelMap[data.backend_source] || '';
    if (!source) {
      return null;
    }
    return (
      <Tag
        color={
          TagColorMap[
            data.is_built_in
              ? BackendSourceValueMap.BUILTIN
              : data.backend_source
          ]
        }
        className="font-400"
        variant="filled"
        style={{
          borderRadius: 'var(--ant-border-radius)',
          margin: 0,
          width: 'max-content'
        }}
      >
        {intl.formatMessage({
          id: source
        })}
      </Tag>
    );
  };

  const renderActions = () => {
    return actionsRenderer ? (
      actionsRenderer(data)
    ) : (
      <span onClick={handleonClickAction} className="operations">
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
    );
  };

  return (
    <StyledCard
      onClick={handleClick}
      clickable={true}
      hoverable={true}
      disabled={false}
      active={active}
      height={136}
      ghost
      header={
        <Header>
          <div className="title">{renderIcon()}</div>
          {renderActions()}
        </Header>
      }
    >
      <Content>
        <CardName>
          <span>
            {data.backend_source === BackendSourceValueMap.CUSTOM
              ? data.backend_name.replace(/-custom$/g, '')
              : data.backend_name}
          </span>
          {renderSource()}
        </CardName>
        {renderFrameworks()}
      </Content>
    </StyledCard>
  );
};

export default BackendCard;
