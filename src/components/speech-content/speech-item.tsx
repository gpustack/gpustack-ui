import IconFont from '@/components/icon-font';
import { formatTime } from '@/utils/index';
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
  const [isPlay, setIsPlay] = useState(props.autoplay);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: [],
    analyser: null
  });
  const ref = useRef<any>(null);

  const handlePlay = () => {
    if (isPlay) {
      ref.current?.pause();
      setIsPlay(false);
      return;
    }
    ref.current?.play();
    setIsPlay(true);
  };

  const handleOnAnalyse = (data: any, analyser: any) => {
    setAudioChunks((pre: any) => {
      return {
        data: data,
        analyser: analyser
      };
    });
  };

  const handleReay = () => {
    const duration = ref.current?.duration?.();
    setDuration(duration < 1 ? 1 : duration);
  };

  const handleOnClick = (value: number) => {
    console.log('current:', value);
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
        {/* {isPlay && (
          <AudioAnimation
            height={82}
            width={500}
            analyserData={audioChunks}
          ></AudioAnimation>
        )} */}
        <div className="voice">
          <IconFont type="icon-user_voice" className="font-size-16" />
        </div>
        <div className="wrapper">
          <AudioPlayer
            {...props}
            audioUrl={props.audioUrl}
            onReady={handleReay}
            onClick={handleOnClick}
            onFinish={() => setIsPlay(false)}
            onAnalyse={handleOnAnalyse}
            ref={ref}
          ></AudioPlayer>
        </div>
      </div>
      <div className="speech-actions">
        <span className="tags">
          <span className="item">{props.format}</span>
        </span>
        <span className="duration">{formatTime(duration)}</span>
        <div className="actions">
          <Tooltip
            title={
              isPlay
                ? intl.formatMessage({ id: 'playground.audio.button.stop' })
                : intl.formatMessage({ id: 'playground.audio.button.play' })
            }
          >
            <Button
              disabled={!props.audioUrl || duration === 0}
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
              disabled={!props.audioUrl || duration === 0}
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
