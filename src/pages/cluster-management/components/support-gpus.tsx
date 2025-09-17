import ascendLogo from '@/assets/logo/ascend.png';
import CambriconPNG from '@/assets/logo/cambricon.png';
import hyponPNG from '@/assets/logo/hygon.png';
import iluvatarWEBP from '@/assets/logo/Iluvatar.png';
import metaxLogo from '@/assets/logo/metax.png';
import moorePNG from '@/assets/logo/moore _threads.png';
import IconFont from '@/components/icon-font';
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
      label: intl.formatMessage({ id: 'vendor.nividia' }),
      value: 'cuda',
      description: '',
      key: 'cuda',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#nvidia-cuda',
      icon: <IconFont type="icon-nvidia2" style={{ fontSize: 32 }} />
    },
    {
      label: 'AMD',
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
      label: intl.formatMessage({ id: 'vendor.ascend' }),
      description: '',
      value: 'npu',
      key: 'npu',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#ascend-cann',
      icon: <ProviderImage src={ascendLogo} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.hygon' }),
      description: '',
      value: 'dcu',
      key: 'dcu',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#hygon-dtk',
      icon: <ProviderImage src={hyponPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.moorthreads' }),
      description: '',
      value: 'musa',
      key: 'musa',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#moore-threads-musa',
      icon: <ProviderImage src={moorePNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.iluvatar' }),
      description: '',
      value: 'corex',
      key: 'corex',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#iluvatar-corex',
      icon: <ProviderImage src={iluvatarWEBP} showBg />
    },
    {
      label: intl.formatMessage({ id: 'vendor.cambricon' }),
      value: 'cambricon',
      key: 'cambricon',
      locale: false,
      link: 'https://docs.gpustack.ai/latest/installation/installation-requirements/#cambricon-mlu',
      icon: <ProviderImage src={CambriconPNG} />
    },
    {
      label: intl.formatMessage({ id: 'vendor.metax' }),
      value: 'metax',
      key: 'metax',
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
