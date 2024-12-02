import useResizeObserver from '@/components/logs-viewer/use-size';
import {
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isPlay, setIsPlay] = useState(props.autoplay);
  const [duration, setDuration] = useState(0);
  const [animationSize, setAnimationSize] = useState({ width: 900, height: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: new Uint8Array(128),
    analyser: null
  });
  const wrapper = useRef<any>(null);
  const ref = useRef<any>(null);

  const size = useResizeObserver(wrapper);

  const handlePlay = () => {
    if (isPlay) {
      ref.current?.pause();
      setIsPlay(false);
      return;
    }
    ref.current?.play();
    setIsPlay(true);
  };

  const handleOnAnalyse = useCallback((data: any, analyser: any) => {
    setAudioChunks((pre: any) => {
      return {
        data: data,
        analyser: analyser
      };
    });
  }, []);

  const handleOnFinish = useCallback(() => {
    setIsPlay(false);
  }, []);

  const handleOnAudioprocess = useCallback((current: number) => {
    setCurrentTime(() => current);
    console.log('current:', current, duration);
  }, []);

  const handleReay = useCallback((duration: number) => {
    setIsPlay(props.autoplay);
    setDuration(duration);
  }, []);

  const handleOnClick = useCallback((value: number) => {
    console.log('current:', value);
  }, []);

  const handleAnimationResize = useCallback((size: any) => {
    console.log('size:=======', size);
    setAnimationSize({
      width: size.width,
      height: size.height
    });
  }, []);

  useEffect(() => {
    console.log('width:', size);
  }, [size]);
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
        <div
          className="wrapper"
          style={{ height: 82, width: '100%' }}
          ref={wrapper}
        >
          <AudioPlayer
            {...props}
            audioUrl={props.audioUrl}
            onReady={handleReay}
            onClick={handleOnClick}
            onFinish={handleOnFinish}
            onAnalyse={handleOnAnalyse}
            onAudioprocess={handleOnAudioprocess}
            ref={ref}
          ></AudioPlayer>
          {/* {isPlay && (
            <AudioAnimation
              maxBarCount={180}
              height={82}
              width={800}
              analyserData={audioChunks}
            ></AudioAnimation>
          )} */}
        </div>
      </div>
      {/* <Slider value={currentTime} max={duration} step={0.01}></Slider> */}
      <div className="speech-actions">
        <span className="tags">
          <span className="item">{props.format}</span>
        </span>
        <span className="duration">{_.round(duration, 2)}</span>
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
