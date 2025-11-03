import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import moorePNG from '@/assets/logo/moore _threads.png';
import IconFont from '@/components/icon-font';
import { GPUDriverMap } from '@/pages/resources/config/gpu-driver';
import { useIntl } from '@umijs/max';
import ProviderCatalog from './provider-catalog';

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
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#nvidia-cuda',
      icon: <IconFont type="icon-nvidia2" style={{ fontSize: 32 }} />
    },
    {
      label: 'AMD',
      description: '',
      value: GPUDriverMap.AMD,
      key: GPUDriverMap.AMD,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#amd-rocm',
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
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#ascend-cann',
      icon: <ProviderImage src={ascendLogo} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.hygon' }),
      description: '',
      value: GPUDriverMap.HYGON,
      key: GPUDriverMap.HYGON,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#hygon-dtk',
      icon: <ProviderImage src={hyponPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.moorthreads' }),
      description: '',
      value: GPUDriverMap.MOORE_THREADS,
      key: GPUDriverMap.MOORE_THREADS,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#moore-threads-musa',
      icon: <ProviderImage src={moorePNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.iluvatar' }),
      description: '',
      value: GPUDriverMap.ILUVATAR,
      key: GPUDriverMap.ILUVATAR,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#iluvatar-corex',
      icon: <ProviderImage src={iluvatarWEBP} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.cambricon' }),
      value: GPUDriverMap.CAMBRICON,
      key: GPUDriverMap.CAMBRICON,
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#cambricon-mlu',
      icon: <ProviderImage src={CambriconPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.metax' }),
      value: GPUDriverMap.METAX,
      key: GPUDriverMap.METAX,
      locale: false,
      icon: <ProviderImage src={metaxLogo} showBg />
    }
  ];
  return (
    <ProviderCatalog
      onSelect={onSelect}
      height={60}
      current={current}
      dataList={supportedHardPlatforms}
      clickable={clickable}
      cols={4}
    />
  );
};

export default SupportedHardware;
