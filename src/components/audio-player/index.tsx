import { formatTime } from '@/utils/index';
import { PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { Button, Slider, Tooltip } from 'antd';
import { round } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle
} from 'react';
import CheckButtons from '../check-buttons';
import IconFont from '../icon-font';
import './index.less';

interface AudioPlayerProps {
  autoplay?: boolean;
  url: string;
  speed?: number;
  ref?: any;
  name: string;
  height?: number;
  width?: number;
  duration?: number;
}

const speedOptions = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
  { label: '4x', value: 4 }
];

const AudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const { autoplay = false, speed: defaultSpeed = 1 } = props;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = React.useState<{
    currentTime: number;
    duration: number;
  }>({
    currentTime: 0,
    duration: 0
  });
  const [playOn, setPlayOn] = React.useState<boolean>(false);
  const [speakerOn, setSpeakerOn] = React.useState<boolean>(false);
  const [volume, setVolume] = React.useState<number>(0.5);
  const [speed, setSpeed] = React.useState<number>(defaultSpeed);
  const timer = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      audioRef.current?.play();
    },
    pause: () => {
      audioRef.current?.pause();
    }
  }));
  const handleShowVolume = useCallback(() => {
    setSpeakerOn(!speakerOn);
  }, [speakerOn]);

  const handleSeepdChange = useCallback((value: number | string) => {
    setSpeed(value as number);
    audioRef.current!.playbackRate = value as number;
  }, []);

  const handleAudioOnPlay = useCallback(() => {
    timer.current = setInterval(() => {
      setAudioState((prestate) => {
        return {
          currentTime: Math.ceil(audioRef.current?.currentTime || 0),
          duration:
            prestate.duration || Math.ceil(audioRef.current?.duration || 0)
        };
      });

      if (audioRef.current?.paused || audioRef.current?.ended) {
        clearInterval(timer.current);
        setPlayOn(false);
        setAudioState((prestate: any) => {
          return {
            currentTime: audioRef.current?.ended ? 0 : prestate.currentTime,
            duration: prestate.duration
          };
        });
      }
    }, 500);
  }, []);

  const handlePlay = useCallback(() => {
    if (playOn) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setPlayOn(!playOn);
  }, [playOn]);

  const handleFormatVolume = (val: number) => {
    return `${round(val * 100)}%`;
  };

  const handleVolumeChange = useCallback((value: number) => {
    audioRef.current!.volume = round(value, 2);
    setVolume(round(value, 2));
  }, []);

  const initPlayerConfig = useCallback(() => {
    audioRef.current!.volume = volume;
    audioRef.current!.playbackRate = speed;
  }, []);

  const handleLoadedMetadata = useCallback(
    (data: any) => {
      const duration = Math.ceil(audioRef.current?.duration || 0);
      setAudioState({
        currentTime: 0,
        duration:
          duration && duration !== Infinity ? duration : props.duration || 0
      });
      setPlayOn(autoplay);
    },
    [autoplay, props.duration]
  );

  const handleCurrentChange = useCallback((val: number) => {
    audioRef.current!.currentTime = val;
    setAudioState((prestate) => {
      return {
        currentTime: val,
        duration: prestate.duration
      };
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      initPlayerConfig();
    }
  }, [audioRef.current]);

  useEffect(() => {
    return () => {
      clearInterval(timer.current);
    };
  }, []);

  return (
    <div className="player-wrap" style={{ width: props.width || '100%' }}>
      <div className="player-ui">
        <span className="play-btn">
          <Button
            size="middle"
            type="text"
            onClick={handlePlay}
            icon={
              !playOn ? (
                <PlayCircleFilled
                  style={{ fontSize: '22px' }}
                ></PlayCircleFilled>
              ) : (
                <PauseCircleFilled
                  style={{ fontSize: '22px' }}
                ></PauseCircleFilled>
              )
            }
          ></Button>
        </span>
        <div className="play-content">
          <span className="time current">
            {' '}
            {formatTime(audioState.currentTime)}
          </span>
          <div className="progress-bar">
            <span className="file-name">{props.name}</span>
            <div className="slider">
              <Slider
                tooltip={{ open: false }}
                min={0}
                max={audioState.duration}
                value={audioState.currentTime}
                onChange={handleCurrentChange}
              />
            </div>
            <Tooltip
              overlayInnerStyle={{
                backgroundColor: 'var(--color-white-1)'
              }}
              arrow={false}
              title={
                <CheckButtons
                  options={speedOptions}
                  onChange={handleSeepdChange}
                  size="small"
                ></CheckButtons>
              }
            >
              <span style={{ cursor: 'pointer' }}>
                {speed ? `${speed}x` : '1x'}
              </span>
            </Tooltip>
          </div>
          <span className="time">{formatTime(audioState.duration)}</span>
        </div>
        <span className="speaker">
          <Button
            size="middle"
            type="text"
            icon={
              <IconFont
                type="icon-SpeakerHigh"
                style={{ fontSize: '22px' }}
              ></IconFont>
            }
          ></Button>
          {speakerOn && (
            <Slider
              tooltip={{ formatter: handleFormatVolume }}
              style={{ height: '100px' }}
              className="volume-slider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              vertical
              onChange={handleVolumeChange}
            />
          )}
        </span>
      </div>
      <audio
        controls
        autoPlay={autoplay}
        src={props.url}
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
        onPlay={handleAudioOnPlay}
        onLoadedMetadata={handleLoadedMetadata}
      ></audio>
    </div>
  );
});

export default React.memo(AudioPlayer);
