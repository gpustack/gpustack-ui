import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import moorePNG from '@/assets/logo/moore _threads.png';
import IconFont from '@/components/icon-font';
import styled from 'styled-components';
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

const supportedHardPlatforms = [
  {
    label: 'NVIDIA CUDA',
    value: 'cuda',
    description: '',
    key: 'cuda',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#nvidia-cuda',
    icon: <IconFont type="icon-nvidia2" style={{ fontSize: 32 }} />
  },
  {
    label: 'AMD ROCm',
    description: '',
    value: 'rocm',
    key: 'rocm',
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
    label: 'Ascend CANN',
    description: '',
    value: 'npu',
    key: 'npu',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#ascend-cann',
    icon: <ProviderImage src={ascendLogo} showBg />
  },
  {
    label: 'Hygon DTK',
    description: '',
    value: 'dcu',
    key: 'dcu',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#hygon-dtk',
    icon: <ProviderImage src={hyponPNG} />
  },
  {
    label: 'Moore Threads',
    description: '',
    value: 'musa',
    key: 'musa',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#moore-threads-musa',
    icon: <ProviderImage src={moorePNG} />
  },
  {
    label: 'Iluvatar Corex',
    description: '',
    value: 'corex',
    key: 'corex',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#iluvatar-corex',
    icon: <ProviderImage src={iluvatarWEBP} showBg />
  },
  {
    label: 'Cambricon',
    value: 'cambricon',
    key: 'cambricon',
    locale: false,
    link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#cambricon-mlu',
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

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  justify-content: center;
  align-self: center;
`;

const renderHeader = (item: any) => {
  return (
    <Header>
      <span className="icon">{item.icon}</span>
      <span className="label">{item.label}</span>
    </Header>
  );
};

const dataList = supportedHardPlatforms.map((item) => {
  return {
    label: renderHeader(item),
    value: item.value,
    key: item.key,
    locale: item.locale
  };
});

interface SupportedHardwareProps {
  onSelect?: (provider: string, item: any) => void;
  currentProvider?: string;
}

const SupportedHardware: React.FC<SupportedHardwareProps> = ({
  onSelect,
  currentProvider
}) => {
  return (
    <ProviderCatalog
      onSelect={onSelect}
      currentProvider={currentProvider}
      dataList={supportedHardPlatforms}
      clickable={true}
      cols={4}
    />
  );
};

export default SupportedHardware;
