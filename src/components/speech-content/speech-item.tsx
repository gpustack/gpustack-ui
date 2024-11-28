import IconFont from '@/components/icon-font';
import {
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import AudioPlayer from './audio-player';
import './styles/index.less';

const audioFormat = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/x-flac': 'flac',
  'audio/pcm': 'pcm',
  'audio/flac': 'flac',
  'audio/x-wav': 'wav',
  'audio/L16': 'pcm',
  'audio/opus': 'opus'
};

interface SpeechContentProps {
  prompt: string;
  autoplay: boolean;
  voice: string;
  format: string;
  speed: number;
  audioUrl: string;
}
const SpeechItem: React.FC<SpeechContentProps> = (props) => {
  const intl = useIntl();
  const [collapsed, setCollapsed] = useState(false);
  const [isPlay, setIsPlay] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    if (isPlay) {
      ref.current?.pause();
      setIsPlay(false);
      return;
    }
    ref.current?.play();
    setIsPlay(true);
  };

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const onDownload = () => {
    const url = props.audioUrl || '';
    const filename = `audio-${dayjs().format('YYYYMMDDHHmmss')}.${props.format}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div className="speech-item">
        <div className="voice">
          <IconFont type="icon-user_voice" className="font-size-16" />
        </div>
        <div className="wrapper">
          <AudioPlayer
            {...props}
            audioUrl={props.audioUrl}
            ref={ref}
          ></AudioPlayer>
        </div>
      </div>
      <div className="speech-actions">
        <span className="tags">
          <span className="item">{props.format}</span>
          <span className="item splitor"></span>
          <span className="item">{props.speed}x</span>
        </span>
        <div className="actions">
          <Tooltip
            title={
              isPlay
                ? intl.formatMessage({ id: 'playground.audio.button.stop' })
                : intl.formatMessage({ id: 'playground.audio.button.play' })
            }
          >
            <Button
              onClick={handlePlay}
              icon={isPlay ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              type="text"
              size="small"
            ></Button>
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({
              id: 'playground.audio.button.download'
            })}
          >
            <Button
              onClick={onDownload}
              icon={<DownloadOutlined />}
              type="text"
              size="small"
            ></Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SpeechItem);
