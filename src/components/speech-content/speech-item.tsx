import AudioAnimation from '@/components/audio-animation';
import {
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Slider, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _, { throttle } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import RawAudioPlayer from '../audio-player/raw-audio-player';
import './styles/index.less';
import './styles/slider-progress.less';

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
  onPlay?: () => void;
  onPause?: () => void;
  isStream?: boolean;
  isPlaying?: boolean;
  playerRef?: React.RefObject<any>;
  analyserData?: {
    data: Uint8Array;
    analyser: any;
  };
}
const SpeechItem: React.FC<SpeechContentProps> = (props) => {
  const { isStream } = props;
  console.log(
    'Rendering SpeechItem with props:',
    props.isStream,
    props.analyserData
  );
  const intl = useIntl();
  const [isPlay, setIsPlay] = useState(props.autoplay || props.isPlaying);
  const [duration, setDuration] = useState<number>(0);
  const [animationSize, setAnimationSize] = useState({ width: 900, height: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: new Uint8Array(128),
    analyser: null
  });
  const wrapper = useRef<any>(null);
  const ref = useRef<any>(null);

  useEffect(() => {
    setIsPlay(props.autoplay || props.isPlaying);
  }, [props.autoplay, props.isPlaying]);

  const isPCMStream = useMemo(() => {
    return props.audioUrl?.startsWith('pcm-stream://');
  }, [props.audioUrl]);

  // Sync internal ref with external playerRef if provided
  React.useEffect(() => {
    if (props.playerRef) {
      (props.playerRef as any).current = ref.current;
    }
  }, [props.playerRef, ref.current]);

  const onPause = () => {
    ref.current?.pause();
    props.onPause?.();
  };

  const onPlay = async () => {
    await ref.current?.wavesurfer.current?.play();
    props.onPlay?.();
  };

  const handlePlay = async () => {
    try {
      if (ref.current?.wavesurfer.current?.isPlaying()) {
        onPause();
        setIsPlay(false);
        return;
      } else {
        await onPlay();
        setIsPlay(true);
      }
    } catch (error) {
      console.log('error:', error);
    }
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

  const handleOnPlay = useCallback(() => {
    setIsPlay(true);
  }, []);

  const handleOnPause = useCallback(() => {
    setIsPlay(false);
  }, []);

  const throttleUpdateCurrentTime = throttle((current: number) => {
    setCurrentTime(current);
  }, 100);

  const handleOnAudioprocess = (current: number) => {
    throttleUpdateCurrentTime(current);
  };

  const handleAnimationResize = useCallback((size: any) => {
    setAnimationSize({
      width: size.width,
      height: size.height
    });
  }, []);

  const debounceSeek = _.debounce((value: number) => {
    ref.current?.seekTo(value / duration);
    setCurrentTime(value);
  }, 200);

  const handleSliderChange = (value: number) => {
    debounceSeek(value);
  };

  const handleReady = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handlOnChangeComplete = useCallback((value: number) => {
    ref.current?.seekTo(value / duration);
    setCurrentTime(value);
  }, []);

  const convertFormat = () => {
    if (props.format === 'pcm') {
      return 'wav';
    }
    return props.format;
  };

  const onDownload = useCallback(() => {
    const url = props.audioUrl || '';
    const filename = `audio-${dayjs().format('YYYYMMDDHHmmss')}.${convertFormat()}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [props.audioUrl, props.format]);

  console.log('isPCMStream:', isPCMStream, isPlay);

  console.log('props.analyserData:', props.analyserData);

  const renderPlayerActions = () => {
    if (isPCMStream) {
      return null;
    }
    return (
      <div>
        <Slider
          className="slider-progress"
          value={currentTime}
          max={duration}
          step={0.01}
          onChange={handleSliderChange}
        ></Slider>
        <div className="speech-actions">
          <span className="tags">
            <span className="item">{props.format}</span>
          </span>
          <span className="duration">
            {_.round(currentTime, 2) || _.round(duration, 2)}
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
                disabled={!props.audioUrl || duration === 0}
                onClick={handlePlay}
                icon={
                  isPlay ? (
                    <PauseCircleOutlined className="font-size-16" />
                  ) : (
                    <PlayCircleOutlined className="font-size-16" />
                  )
                }
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
                icon={<DownloadOutlined className="font-size-16" />}
                type="text"
                size="small"
              ></Button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="speech-item">
        <div
          className="wrapper"
          style={{ height: 120, width: '100%' }}
          ref={wrapper}
        >
          <>
            {/* {!isPCMStream && (
              <AudioPlayer
                {...props}
                audioUrl={props.audioUrl}
                onReady={handleReady}
                onFinish={handleOnFinish}
                onPlay={handleOnPlay}
                onPause={handleOnPause}
                onAnalyse={handleOnAnalyse}
                onAudioprocess={handleOnAudioprocess}
                ref={ref}
              ></AudioPlayer>
            )} */}
            {!isPCMStream && (
              <RawAudioPlayer
                {...props}
                url={props.audioUrl}
                onReady={handleReady}
                onEnded={handleOnFinish}
                onPlay={handleOnPlay}
                onPause={handleOnPause}
                onAnalyse={handleOnAnalyse}
                onAudioProcess={handleOnAudioprocess}
                ref={ref}
              ></RawAudioPlayer>
            )}
            {isPlay &&
              (props.analyserData?.analyser?.current ||
                audioChunks.analyser?.current) && (
                <AudioAnimation
                  maxBarCount={100}
                  amplitude={60}
                  fixedHeight={true}
                  height={120}
                  width={800}
                  analyserData={props.analyserData || audioChunks}
                ></AudioAnimation>
              )}
          </>
        </div>
      </div>
      {renderPlayerActions()}
    </div>
  );
};

export default SpeechItem;
