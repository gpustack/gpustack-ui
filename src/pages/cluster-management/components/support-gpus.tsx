import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import mooreLogo from '@/assets/logo/moore-logo.png';
import nvidiaLogo from '@/assets/logo/nvidia.png';
import theadLogoEN from '@/assets/logo/t-head-en.png';
import theadLogoZH from '@/assets/logo/t-head-zh.png';
import IconFont from '@/components/icon-font';
import useUserSettings from '@/hooks/use-user-settings';
import {
  AddWorkerDockerNotes,
  GPUDriverMap
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import styled from 'styled-components';
import ProviderCatalog from './provider-catalog';

const Box = styled.div`
  .template-card-wrapper {
    position: relative;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.1);
    &.active {
      background-color: var(--ant-color-fill-tertiary);
    }
    .template-card-icon {
      margin-right: 0;
    }
    .template-card-inner {
      line-height: 1;
      flex-direction: row;
      height: auto;
      width: 0;
      overflow: visible;
      .template-card-content {
        font-size: 13px;
      }
    }
    .extra {
      position: absolute;
      right: 2px;
      top: 2px;
      padding: 2px;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 400;
      background-color: var(--ant-blue-1);
    }
  }
  &.dark-theme {
    .template-card-wrapper {
      background-color: rgba(255, 255, 255, 0.05);
      &:hover {
        background-color: var(--ant-color-bg-solid);
      }
      &.active {
        background-color: var(--ant-color-bg-solid);
      }
    }
  }
`;

const ProviderImage = ({ src, height }: { src: string; height?: number }) => {
  return (
    <img
      src={src}
      style={{
        height: height || 20,
        objectFit: 'contain'
      }}
    />
  );
};

interface SupportedHardwareProps {
  onSelect?: (provider: string, item: any) => void;
  current?: string;
  clickable?: boolean;
}

const SupportedHardware: React.FC<SupportedHardwareProps> = ({
  onSelect,
  clickable,
  current
}) => {
  const intl = useIntl();
  const { userSettings } = useUserSettings();

  const supportedHardPlatforms = [
    {
      label: 'NVIDIA',
      hiddenTitle: true,
      value: GPUDriverMap.NVIDIA,
      description: '',
      key: GPUDriverMap.NVIDIA,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.NVIDIA],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#nvidia-gpu',
      icon: <ProviderImage src={nvidiaLogo} height={18} />
    },
    {
      label: `AMD `,
      hiddenTitle: true,
      description: '',
      value: GPUDriverMap.AMD,
      key: GPUDriverMap.AMD,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.AMD],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#amd-gpu',
      icon: (
        <IconFont
          type="icon-amd-logo"
          style={{ fontSize: 64, color: '#000' }}
        />
      )
    },
    {
      label: intl.formatMessage({ id: 'vendor.ascend' }),
      hiddenTitle: true,
      description: '',
      value: GPUDriverMap.ASCEND,
      key: GPUDriverMap.ASCEND,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.ASCEND],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#ascend-npu',
      icon: <ProviderImage src={ascendLogo} height={30} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.hygon' }),
      hiddenTitle: true,
      description: '',
      value: GPUDriverMap.HYGON,
      key: GPUDriverMap.HYGON,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.HYGON],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#hygon-dcu',
      icon: <ProviderImage src={hyponPNG} height={18} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.moorthreads' }),
      hiddenTitle: true,
      extra: intl.formatMessage({ id: 'common.tag.experimental' }),
      value: GPUDriverMap.MOORE_THREADS,
      key: GPUDriverMap.MOORE_THREADS,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.MOORE_THREADS],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#mthreads-gpu',
      icon: <ProviderImage src={mooreLogo} height={24} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.iluvatar' }),
      hiddenTitle: true,
      extra: intl.formatMessage({ id: 'common.tag.experimental' }),
      value: GPUDriverMap.ILUVATAR,
      key: GPUDriverMap.ILUVATAR,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.ILUVATAR],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#iluvatar-gpu',
      icon: <ProviderImage src={iluvatarWEBP} height={24} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.cambricon' }),
      hiddenTitle: true,
      extra: intl.formatMessage({ id: 'common.tag.experimental' }),
      value: GPUDriverMap.CAMBRICON,
      key: GPUDriverMap.CAMBRICON,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.CAMBRICON],
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#cambricon-mlu',
      icon: <ProviderImage src={CambriconPNG} height={24} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.metax' }),
      hiddenTitle: true,
      extra: intl.formatMessage({ id: 'common.tag.experimental' }),
      value: GPUDriverMap.METAX,
      key: GPUDriverMap.METAX,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#metax-gpu',
      notes: AddWorkerDockerNotes[GPUDriverMap.METAX],
      icon: <ProviderImage src={metaxLogo} height={20} />
    },
    {
      label: `${intl.formatMessage({ id: 'vendor.thead' })} `,
      hiddenTitle: true,
      extra: intl.formatMessage({ id: 'common.tag.experimental' }),
      value: GPUDriverMap.THEAD,
      key: GPUDriverMap.THEAD,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/requirements/#thead-gpu',
      notes: AddWorkerDockerNotes[GPUDriverMap.THEAD],
      icon: (
        <ProviderImage
          src={intl?.locale === 'zh-CN' ? theadLogoZH : theadLogoEN}
          height={22}
        />
      )
    }
  ];

  return (
    <Box className={userSettings?.theme === 'realDark' ? 'dark-theme' : ''}>
      <ProviderCatalog
        onSelect={onSelect}
        height={60}
        current={current}
        dataList={supportedHardPlatforms}
        clickable={clickable}
        showTooltip={true}
        cols={5}
      />
    </Box>
  );
};

export default SupportedHardware;
