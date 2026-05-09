import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import mooreLogo from '@/assets/logo/moore-logo.png';
import nvidiaLogo from '@/assets/logo/nvidia.png';
import theadLogoEN from '@/assets/logo/t-head-en.png';
import theadLogoZH from '@/assets/logo/t-head-zh.png';
import { GPUDriverMap } from '@/pages/resources/config/gpu-driver';
import {
  AutoTooltip,
  DropdownActions,
  IconFont,
  TemplateCard
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Tag } from 'antd';
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
  .title {
    display: flex;
    align-items: center;
  }
`;

const CardName = styled.div`
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  color: var(--ant-color-text);
  margin-bottom: 8px;
  gap: 8px;
  width: 100%;
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

const LogoImg = styled.img`
  object-fit: contain;
`;

interface TemplateCardProps {
  data: ListItem;
  onSelect?: (item: { action: string; data: ListItem }) => void;
}

const TemplateCardItem: React.FC<TemplateCardProps> = ({ data, onSelect }) => {
  const intl = useIntl();

  const handleOnSelect = (item: any) => {
    onSelect?.({ action: item.key, data });
  };

  const handleonClickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderLogo = () => {
    switch (data.manufacturer) {
      case GPUDriverMap.NVIDIA:
        return <LogoImg src={nvidiaLogo} height={18} />;
      case GPUDriverMap.AMD:
        return (
          <IconFont
            type="icon-amd-logo"
            style={{ fontSize: 36, color: 'var(--ant-color-text)' }}
          />
        );
      case GPUDriverMap.ASCEND:
        return <LogoImg src={ascendLogo} height={24} />;
      case GPUDriverMap.HYGON:
        return <LogoImg src={hyponPNG} height={18} />;
      case GPUDriverMap.METAX:
        return <LogoImg src={metaxLogo} height={20} />;
      case GPUDriverMap.MOORE_THREADS:
        return <LogoImg src={mooreLogo} height={22} />;
      case GPUDriverMap.ILUVATAR:
        return <LogoImg src={iluvatarWEBP} height={22} />;
      case GPUDriverMap.CAMBRICON:
        return <LogoImg src={CambriconPNG} height={22} />;
      case GPUDriverMap.THEAD:
        return (
          <LogoImg
            src={intl?.locale === 'zh-CN' ? theadLogoZH : theadLogoEN}
            height={20}
          />
        );
      case 'cpu':
        return (
          <Tag color="geekblue" style={{ paddingBlock: 2 }}>
            <IconFont
              type="icon-cpu"
              style={{ fontSize: 22, display: 'flex' }}
            />
          </Tag>
        );
      default:
        return null;
    }
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

  return (
    <StyledCard
      clickable={false}
      hoverable={true}
      disabled={false}
      height={126}
      ghost
      header={
        <Header>
          <div className="title">{renderLogo()}</div>
          {renderActions()}
        </Header>
      }
    >
      <Content>
        <CardName>
          <AutoTooltip ghost minWidth={20}>
            {data.name || '-'}
          </AutoTooltip>
        </CardName>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-model" />{' '}
            {intl.formatMessage({ id: 'gpuservice.template.card.image' })}:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{data.spec?.image || '-'}</span>
          </AutoTooltip>
        </InfoItem>
      </Content>
    </StyledCard>
  );
};

export default TemplateCardItem;
