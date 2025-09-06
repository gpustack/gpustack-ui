import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import moorePNG from '@/assets/logo/moore _threads.png';
import nvidiaLogo from '@/assets/logo/nvidia.png';
import IconFont from '@/components/icon-font';
import ProviderCatalog from './provider-catalog';

const ProviderImage = ({ src, showBg }: { src: string; showBg?: boolean }) => {
  return (
    <img
      src={src}
      style={{
        width: 46,
        objectFit: 'contain'
      }}
      width={46}
    />
  );
};

const supportedHardPlatforms = [
  {
    label: 'NVIDIA CUDA',
    value: 'cuda',
    key: 'nvidia',
    locale: false,
    icon: <ProviderImage src={nvidiaLogo} showBg />
  },
  {
    label: 'AMD ROCm',
    value: 'rocm',
    key: 'amd',
    locale: false,
    icon: (
      <IconFont
        type="icon-amd"
        style={{ fontSize: 46, color: 'var(--ant-color-text)' }}
      />
    )
  },
  {
    label: 'Ascend CANN',
    value: 'npu',
    key: 'ascend',
    locale: false,
    icon: <ProviderImage src={ascendLogo} showBg />
  },
  {
    label: 'Hygon DTK',
    value: 'dcu',
    key: 'hygon',
    locale: false,
    icon: <ProviderImage src={hyponPNG} />
  },
  {
    label: 'Moore Threads MUSA',
    value: 'musa',
    key: 'musa',
    locale: false,
    icon: <ProviderImage src={moorePNG} />
  },
  {
    label: 'Iluvatar Corex',
    value: 'corex',
    key: 'corex',
    locale: false,
    icon: <ProviderImage src={iluvatarWEBP} showBg />
  },
  {
    label: 'Cambricon',
    value: 'cambricon',
    key: 'cambricon',
    locale: false,
    icon: <ProviderImage src={CambriconPNG} />
  },
  {
    label: 'Metax',
    value: 'metax',
    key: 'metax',
    locale: false,
    icon: <ProviderImage src={metaxLogo} showBg />
  }
];

const SupportedHardware = () => {
  return (
    <ProviderCatalog dataList={supportedHardPlatforms} clickable={false} />
  );
};

export default SupportedHardware;
