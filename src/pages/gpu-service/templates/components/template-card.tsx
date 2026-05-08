import {
  AutoTooltip,
  DropdownActions,
  IconFont,
  TemplateCard
} from '@gpustack/core-ui';
import { Button } from 'antd';
import styled from 'styled-components';
import { templateActions } from '../config';
import { ListItem } from '../config/types';

const StyledCard = styled(TemplateCard)`
  &:hover {
    .operations {
      background-color: var(--ant-color-fill-tertiary);
      border-radius: var(--ant-border-radius-lg);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  width: 100%;
`;

const CardTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  color: var(--ant-color-text);
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 12px;
  gap: 8px;
  color: var(--ant-color-text-secondary);
`;

const InfoItem = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  color: var(--ant-color-text-tertiary);
  .icon {
    color: var(--ant-color-text-quaternary);
  }
  .value {
    color: var(--ant-color-text);
  }
`;

interface TemplateCardProps {
  data: ListItem;
  onSelect?: (item: { action: string; data: ListItem }) => void;
}

const TemplateCardItem: React.FC<TemplateCardProps> = ({ data, onSelect }) => {
  const handleOnSelect = (item: any) => {
    onSelect?.({ action: item.key, data });
  };

  const handleonClickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderActions = () => {
    return (
      <span onClick={handleonClickAction} className="operations">
        <DropdownActions
          menu={{
            items: templateActions,
            onClick: handleOnSelect
          }}
        >
          <Button
            icon={<IconFont type="icon-more" />}
            size="small"
            type="text"
          />
        </DropdownActions>
      </span>
    );
  };

  const ports = data.ports || [];
  const portText = ports.length
    ? ports.map((p) => `${p.protocol?.toUpperCase()}:${p.port}`).join(', ')
    : '-';

  const resources = [data.resources?.cpu, data.resources?.ram]
    .filter(Boolean)
    .join(' / ');

  return (
    <StyledCard
      clickable={false}
      hoverable={true}
      disabled={false}
      height={126}
      ghost
      header={
        <Header>
          <CardTitle>
            <AutoTooltip ghost minWidth={20}>
              {data.name || '-'}
            </AutoTooltip>
          </CardTitle>
          {renderActions()}
        </Header>
      }
    >
      <Content>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-model" /> 镜像:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{data.image || '-'}</span>
          </AutoTooltip>
        </InfoItem>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-storage-outlined" /> 挂载:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{data.volumeMount || '-'}</span>
          </AutoTooltip>
        </InfoItem>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-gpu1" /> 资源:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{resources || '-'}</span>
          </AutoTooltip>
        </InfoItem>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-network" /> 端口:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{portText}</span>
          </AutoTooltip>
        </InfoItem>
      </Content>
    </StyledCard>
  );
};

export default TemplateCardItem;
