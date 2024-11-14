import { formatTime } from '@/utils/index';
import { PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { Button, Slider } from 'antd';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle
} from 'react';
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
            currentTime: 0,
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

  const initPlayerConfig = useCallback(() => {
    // set volume
    audioRef.current!.volume = volume;
    // set playback rate
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
            <span>{props.speed ? `${props.speed}x` : '1x'}</span>
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
