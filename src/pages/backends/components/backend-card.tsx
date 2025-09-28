import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import Card from '@/components/templates/card';
import { DockerOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import {
  backendActions,
  builtInBackendLogos,
  customColors,
  customIcons
} from '../config';
import { ListItem } from '../config/types';

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

interface BackendCardProps {
  onClick?: (data: any) => void;
  onSelect?: (item: any) => void;
  data: ListItem;
}

const BackendCard: React.FC<BackendCardProps> = ({ data, onSelect }) => {
  const handleOnSelect = (item: any) => {
    onSelect?.({ action: item.key, data: data });
  };

  const handleClick = () => {
    onSelect?.({ action: 'edit', data: data });
  };

  const renderIcon = () => {
    if (builtInBackendLogos[data.backend_name]) {
      return <img src={builtInBackendLogos[data.backend_name]} height={20} />;
    }
    const color = customColors[data.id % customColors.length];
    const icon = customIcons[data.id % customIcons.length];

    return (
      <TagInner color={color} bordered={false}>
        {icon}
      </TagInner>
    );
  };

  const actions = useMemo(() => {
    if (data.is_build_in) {
      return backendActions.filter((item) => item.key !== 'delete');
    }
    return backendActions;
  }, [data.is_build_in]);

  return (
    <Card
      onClick={handleClick}
      clickable={true}
      disabled={false}
      height={160}
      ghost
      header={
        <Header>
          <div className="title">{renderIcon()}</div>
          <span>
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
          {data.is_build_in && (
            <Tag
              color="geekblue"
              className="font-400"
              bordered={false}
              style={{ borderRadius: 'var(--ant-border-radius)' }}
            >
              Built-in
            </Tag>
          )}
        </CardName>
        <div className="info">
          <span className="label">
            <InfoCircleOutlined className="icon" />
            <span>Default Version: </span>
          </span>
          <span className="text">{data.default_version}</span>
          <span className="label">
            <DockerOutlined className="icon" />
            <span>Default Image: </span>
          </span>
          <span className="text">
            {_.get(data, [
              'version_configs',
              data.default_version,
              'image_name'
            ])}
          </span>
        </div>
      </Content>
    </Card>
  );
};

export default BackendCard;
