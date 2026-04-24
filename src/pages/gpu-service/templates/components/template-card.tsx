import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hygonPNG from '@/assets/logo/hygon.png';
import iluvatarLogo from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import mooreLogo from '@/assets/logo/moore-logo.png';
import nvidiaLogo from '@/assets/logo/nvidia.png';
import theadLogoEN from '@/assets/logo/t-head-en.png';
import theadLogoZH from '@/assets/logo/t-head-zh.png';
import { GPUDriverMap, GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import {
  AutoTooltip,
  DropdownActions,
  IconFont,
  TemplateCard
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import styled from 'styled-components';
import { templateActions, TemplateStatusValueMap } from '../config';
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

const VendorLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  max-width: 88px;
  height: 18px;
  .logo-img {
    max-width: 100%;
    object-fit: contain;
  }
  .amd-logo {
    font-size: 28px;
    line-height: 1;
    color: var(--ant-color-text);
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

const vendorLogoMap: Record<string, { src: string; height: number }> = {
  [GPUDriverMap.NVIDIA]: { src: nvidiaLogo, height: 16 },
  [GPUDriverMap.ASCEND]: { src: ascendLogo, height: 18 },
  [GPUDriverMap.HYGON]: { src: hygonPNG, height: 16 },
  [GPUDriverMap.MOORE_THREADS]: { src: mooreLogo, height: 18 },
  [GPUDriverMap.ILUVATAR]: { src: iluvatarLogo, height: 18 },
  [GPUDriverMap.CAMBRICON]: { src: CambriconPNG, height: 18 },
  [GPUDriverMap.METAX]: { src: metaxLogo, height: 18 }
};

const TemplateCardItem: React.FC<TemplateCardProps> = ({ data, onSelect }) => {
  const intl = useIntl();
  const vendorLabel = data.vendor
    ? GPUsConfigs[data.vendor]?.label || data.vendor
    : '-';

  const renderVendor = () => {
    if (data.vendor === GPUDriverMap.AMD) {
      return (
        <VendorLogo title={vendorLabel}>
          <IconFont className="amd-logo" type="icon-amd-logo" />
        </VendorLogo>
      );
    }

    const logo =
      data.vendor === GPUDriverMap.THEAD
        ? {
            src: intl.locale === 'zh-CN' ? theadLogoZH : theadLogoEN,
            height: 18
          }
        : vendorLogoMap[data.vendor || ''];

    if (!logo) {
      return vendorLabel;
    }

    return (
      <VendorLogo title={vendorLabel}>
        <img
          alt={vendorLabel}
          className="logo-img"
          src={logo.src}
          style={{ height: logo.height }}
        />
      </VendorLogo>
    );
  };

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

  const status = data.status || TemplateStatusValueMap.Enabled;

  return (
    <StyledCard
      clickable={false}
      hoverable={true}
      disabled={false}
      height={126}
      ghost
      header={
        <Header>
          {renderVendor()}
          {renderActions()}
        </Header>
      }
    >
      <Content>
        <CardName>
          <AutoTooltip ghost minWidth={20}>
            {data.name}
          </AutoTooltip>
        </CardName>
        <InfoItem>
          <span>
            <IconFont className="icon" type="icon-model" /> 镜像:
          </span>
          <AutoTooltip ghost minWidth={20}>
            <span className="value">{data.image || '-'}</span>
          </AutoTooltip>
        </InfoItem>
      </Content>
    </StyledCard>
  );
};

export default TemplateCardItem;
