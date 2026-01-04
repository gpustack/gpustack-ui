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
  builtInBackendLogos,
  customColors,
  customIcons,
  getGpuColor
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
  margin-bottom: 4px;
  gap: 16px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 12px;
  gap: 16px;
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
    const color = customColors[data.id % customColors.length];
    const icon = customIcons[data.id % customIcons.length];

    return (
      <TagInner color={color} variant="filled">
        {icon}
      </TagInner>
    );
  };

  const actions = useMemo(() => {
    if (data.is_built_in) {
      return backendActions.filter((item) => item.key !== 'delete');
    }
    return backendActions.filter((item) => item.key !== 'view_versions');
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

  return (
    <StyledCard
      onClick={handleClick}
      clickable={true}
      hoverable={true}
      disabled={false}
      height={140}
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
          {data.is_built_in && (
            <Tag
              color="geekblue"
              className="font-400"
              variant="filled"
              style={{ borderRadius: 'var(--ant-border-radius)', margin: 0 }}
            >
              {intl.formatMessage({ id: 'backend.builtin' })}
            </Tag>
          )}
        </CardName>
        {renderFrameworks()}
      </Content>
    </StyledCard>
  );
};

export default BackendCard;
