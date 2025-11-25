import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import moorePNG from '@/assets/logo/moore _threads.png';
import IconFont from '@/components/icon-font';
import {
  AddWorkerDockerNotes,
  GPUDriverMap
} from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import styled from 'styled-components';
import ProviderCatalog from './provider-catalog';

const Box = styled.div`
  .template-card-wrapper {
    .template-card-inner {
      line-height: 1;
      .template-card-content {
        font-size: 13px;
      }
    }
  }
`;

const ProviderImage = ({ src, showBg }: { src: string; showBg?: boolean }) => {
  return (
    <img
      src={src}
      style={{
        width: 32,
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

  const supportedHardPlatforms = [
    {
      label: 'NVIDIA',
      value: GPUDriverMap.NVIDIA,
      description: '',
      key: GPUDriverMap.NVIDIA,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.NVIDIA],
      link: 'https://docs.gpustack.ai/latest/installation/nvidia/installation/#prerequisites',
      icon: <IconFont type="icon-nvidia2" style={{ fontSize: 32 }} />
    },
    {
      label: 'AMD',
      description: '',
      value: GPUDriverMap.AMD,
      key: GPUDriverMap.AMD,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.AMD],
      link: 'https://docs.gpustack.ai/latest/installation/amd/installation/#prerequisites',
      icon: (
        <IconFont
          type="icon-amd"
          style={{ fontSize: 32, color: 'var(--ant-color-text)' }}
        />
      )
    },
    {
      label: intl.formatMessage({ id: 'vendor.ascend' }),
      description: '',
      value: GPUDriverMap.ASCEND,
      key: GPUDriverMap.ASCEND,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.ASCEND],
      link: 'https://docs.gpustack.ai/latest/installation/ascend/installation/#prerequisites',
      icon: <ProviderImage src={ascendLogo} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.hygon' }),
      description: 'common.tag.experimental',
      value: GPUDriverMap.HYGON,
      key: GPUDriverMap.HYGON,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.HYGON],
      link: 'https://docs.gpustack.ai/latest/installation/hygon/installation/#prerequisites',
      icon: <ProviderImage src={hyponPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.moorthreads' }),
      description: 'common.tag.experimental',
      value: GPUDriverMap.MOORE_THREADS,
      key: GPUDriverMap.MOORE_THREADS,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.MOORE_THREADS],
      link: 'https://docs.gpustack.ai/latest/installation/mthreads/installation/#prerequisites',
      icon: <ProviderImage src={moorePNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.iluvatar' }),
      description: 'common.tag.experimental',
      value: GPUDriverMap.ILUVATAR,
      key: GPUDriverMap.ILUVATAR,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.ILUVATAR],
      link: 'https://docs.gpustack.ai/latest/installation/iluvatar/installation/#prerequisites',
      icon: <ProviderImage src={iluvatarWEBP} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.cambricon' }),
      description: 'common.tag.experimental',
      value: GPUDriverMap.CAMBRICON,
      key: GPUDriverMap.CAMBRICON,
      locale: false,
      notes: AddWorkerDockerNotes[GPUDriverMap.CAMBRICON],
      link: 'https://docs.gpustack.ai/latest/installation/cambricon/installation/#prerequisites',
      icon: <ProviderImage src={CambriconPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.metax' }),
      description: 'common.tag.experimental',
      value: GPUDriverMap.METAX,
      key: GPUDriverMap.METAX,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/metax/installation/?h=meta#prerequisites',
      notes: AddWorkerDockerNotes[GPUDriverMap.METAX],
      icon: <ProviderImage src={metaxLogo} showBg />
    }
  ];

  return (
    <Box>
      <ProviderCatalog
        onSelect={onSelect}
        height={50}
        current={current}
        dataList={supportedHardPlatforms}
        clickable={clickable}
        cols={4}
      />
    </Box>
  );
};

export default SupportedHardware;
