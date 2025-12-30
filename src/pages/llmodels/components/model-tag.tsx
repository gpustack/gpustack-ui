import IconFont from '@/components/icon-font';
import {
  AudioOutlined,
  PictureOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { Tag } from 'antd';
import { modelCategoriesMap } from '../config';

export const categoryConfig = {
  [modelCategoriesMap.reranker]: {
    icon: <IconFont type="icon-rank1" />,
    color: 'cyan',
    label: 'Reranker'
  },
  [modelCategoriesMap.embedding]: {
    icon: <IconFont type="icon-cube" />,
    color: 'magenta',
    label: 'Embedding'
  },
  [modelCategoriesMap.text_to_speech]: {
    icon: <IconFont type="icon-sound-wave" />,
    color: 'geekblue',
    label: 'Text-To-Speech'
  },
  [modelCategoriesMap.speech_to_text]: {
    icon: <AudioOutlined />,
    color: 'processing',
    label: 'Speech-To-Text'
  },
  [modelCategoriesMap.image]: {
    icon: <PictureOutlined />,
    color: 'orange',
    label: 'Image'
  },
  [modelCategoriesMap.llm]: {
    icon: <WechatWorkOutlined />,
    color: 'green',
    label: 'LLM'
  }
};

interface ModelTagProps {
  categoryKey: keyof typeof categoryConfig;
  size?: number;
}

const ModelTag: React.FC<ModelTagProps> = ({ categoryKey, size }) => {
  const config = categoryConfig[categoryKey];

  if (!config) return null;

  return (
    <Tag
      icon={config.icon}
      variant="outlined"
      style={{
        height: size,
        margin: 0,
        opacity: 1,
        paddingInline: 8,
        borderRadius: 12,
        transform: 'scale(0.9)'
      }}
      color={config.color}
    >
      {config.label}
    </Tag>
  );
};

export default ModelTag;
