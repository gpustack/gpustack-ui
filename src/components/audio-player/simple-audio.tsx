import { formatTime } from '@/utils/index';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Slider, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo
} from 'react';
import styled from 'styled-components';
import AutoTooltip from '../auto-tooltip';
import IconFont from '../icon-font';

type ActionItem = 'download' | 'delete' | 'speed';

interface AudioPlayerProps {
  autoplay?: boolean;
  url: string;
  speed?: number;
  ref?: any;
  name: string;
  height?: number;
  width?: number;
  duration?: number;
  actions?: ActionItem[];
  onDelete?: () => void;
}

const SliderWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  .ant-slider {
    flex: 1;
  }
  .time {
    color: var(--ant-color-text-tertiary);
  }
`;

const useStyles = createStyles(({ css, token }) => {
  // @ts-ignore
  const isDarkMode = token.darkMode as boolean;
  return {
    wrapper: css`
      position: relative;
      min-width: 360px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 8px 10px;
      background-color: ${isDarkMode
        ? 'var(--ant-color-fill-secondary)'
        : '#F1F3F4'};
      border-radius: 28px;
      .inner {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex: 1;
        gap: 8px;
        .slider {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex: 1;
          .ant-slider {
            margin: 0;
          }
          &:hover {
            .ant-slider-handle {
              opacity: 1;
              transition: opacity 0.3s ease-in-out;
            }
          }
          &:focus-within {
            .ant-slider-handle {
              opacity: 1;
            }
          }
        }

        .ant-slider-handle {
          opacity: 0;
          &::before {
            background-color: var(--ant-color-bg-spotlight);
            border-radius: 50%;
          }
          &::after {
            display: none;
          }
        }
      }
    `
  };
});

const sliderStyles = {
  rail: {
    borderRadius: '4px',
    backgroundColor: 'var(--ant-color-fill-secondary)'
  },
  track: {
    borderRadius: '4px',
    backgroundColor: 'var(--ant-color-bg-spotlight)'
  }
};

const speedOptions = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
  { label: '4x', value: 4 }
];

const speedConfig = {
  min: 0.5,
  max: 2,
  step: 0.25
};

const AudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const {
    autoplay = false,
    speed: defaultSpeed = 1,
    actions = ['delete'],
    name,
    onDelete
  } = props;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = React.useState<{
    currentTime: number;
    duration: number;
  }>({
    currentTime: 0,
    duration: 0
  });
  console.log('audioState', name);
  const [playOn, setPlayOn] = React.useState<boolean>(false);
  const [speakerOn, setSpeakerOn] = React.useState<boolean>(false);
  const [volume, setVolume] = React.useState<number>(1);
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
    setPlayOn(!playOn);
    if (playOn) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  }, [playOn]);

  const handleFormatVolume = (val?: number) => {
    if (val === undefined) {
      return `${round(volume * 100)}%`;
    }
    return `${round(val * 100)}%`;
  };

  const handleVolumeChange = useCallback((value: number) => {
    audioRef.current!.volume = round(value, 2);
    setVolume(round(value, 2));
  }, []);

  const initPlayerConfig = () => {
    if (audioRef.current) {
      audioRef.current!.volume = volume;
      audioRef.current!.playbackRate = speed;
    }
  };

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

  const handleReduceSpeed = () => {
    setSpeed((pre) => {
      if (pre - speedConfig.step < speedConfig.min) {
        return speedConfig.min;
      }
      const next = pre - speedConfig.step;
      audioRef.current!.playbackRate = next;
      return next;
    });
  };

  const handleAddSpeed = () => {
    setSpeed((pre) => {
      if (pre + speedConfig.step > speedConfig.max) {
        return speedConfig.max;
      }
      const next = pre + speedConfig.step;
      audioRef.current!.playbackRate = next;
      return next;
    });
  };

  const handleOnLoad = (e: any) => {
    console.log('onload', e);
  };

  const onDownload = useCallback(() => {
    const url = props.url || '';
    const filename = props.name;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'audio.mp3'; // Default filename
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [props.url, props.name]);

  const items: MenuProps['items'] = useMemo(() => {
    return [
      {
        key: 'download',
        label: intl.formatMessage({ id: 'common.button.download' }),
        icon: <DownloadOutlined />,
        onClick: onDownload
      },
      {
        key: 'speed',
        label: intl.formatMessage({ id: 'playground.params.speed' }),
        icon: <IconFont type="icon-play-speed"></IconFont>,
        children: speedOptions.map((item) => ({
          key: item.value,
          label: item.label,
          onClick: () => handleSeepdChange(item.value)
        }))
      },
      {
        key: 'delete',
        label: intl.formatMessage({ id: 'common.button.delete' }),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current.load();
          }
          setAudioState({ currentTime: 0, duration: 0 });
          setPlayOn(false);
          onDelete?.();
        }
      }
    ].filter((item) => actions.includes(item.key as ActionItem));
  }, [actions, intl, onDownload, onDelete, handleSeepdChange]);

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
    <div
      className={styles.wrapper}
      style={{
        width: props.width || '100%',
        height: props.height || '60px',
        position: 'relative'
      }}
    >
      <div className="inner">
        <Button
          size="middle"
          type="text"
          onClick={handlePlay}
          shape="circle"
          disabled={!audioState?.duration}
          icon={
            !playOn ? (
              <IconFont
                type="icon-playcircle-fill"
                style={{ fontSize: '24px' }}
              ></IconFont>
            ) : (
              <IconFont
                type="icon-stopcircle-fill"
                style={{ fontSize: '24px' }}
              ></IconFont>
            )
          }
        ></Button>

        <div className="slider">
          <div className="flex-center flex-between file-name">
            <AutoTooltip ghost maxWidth={200}>
              <span>{name}</span>
            </AutoTooltip>
          </div>
          <SliderWrapper>
            <span className="time">{formatTime(audioState.currentTime)}</span>
            <Slider
              tooltip={{ open: false }}
              min={0}
              step={1}
              styles={sliderStyles}
              max={audioState.duration}
              value={audioState.currentTime}
              onChange={handleCurrentChange}
            />
          </SliderWrapper>
        </div>
        <Dropdown menu={{ items }} trigger={['click']}>
          <Button
            icon={<IconFont type="icon-more"></IconFont>}
            type="text"
            size="middle"
            shape="circle"
          ></Button>
        </Dropdown>
      </div>
      <audio
        crossOrigin="anonymous"
        autoPlay={autoplay}
        src={props.url}
        ref={audioRef}
        preload="metadata"
        style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
        onPlay={handleAudioOnPlay}
        onLoadedMetadata={handleLoadedMetadata}
      ></audio>
    </div>
  );
});

export default React.memo(AudioPlayer);
