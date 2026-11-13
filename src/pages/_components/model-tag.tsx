import {
  AudioOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { IconFont, ThemeTag } from '@gpustack/core-ui';
import { categoryOptions } from '../llmodels/config/categories';

const categoryIcons = {
  rank: <IconFont type="icon-rank1" />,
  cube: <IconFont type="icon-cube" />,
  'sound-wave': <IconFont type="icon-sound-wave" />,
  audio: <AudioOutlined />,
  picture: <PictureOutlined />,
  video: <VideoCameraOutlined />,
  chat: <WechatWorkOutlined />,
  'alt-route': <IconFont type="icon-alt-route" />
};

export const categoryConfig = Object.fromEntries(
  categoryOptions.map((option) => [
    option.value,
    {
      ...option,
      icon: categoryIcons[option.icon as keyof typeof categoryIcons]
    }
  ])
);

interface ModelTagProps {
  categoryKey: keyof typeof categoryConfig;
  size?: number;
}

const ModelTag: React.FC<ModelTagProps> = ({ categoryKey, size }) => {
  const config = categoryConfig[categoryKey];

  if (!config) return null;

  return (
    <ThemeTag
      opacity={1}
      icon={config.icon}
      variant={'outlined'}
      style={{
        height: size,
        margin: 0,
        paddingInline: 8,
        borderRadius: 12,
        transform: 'scale(0.9)',
        backgroundColor: 'transparent'
      }}
      color={config.color}
    >
      {config.label}
    </ThemeTag>
  );
};

export default ModelTag;
