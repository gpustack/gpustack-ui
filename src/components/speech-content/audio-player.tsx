import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import useWavesurfer from './hooks/use-wavesurfer';

interface AudioPlayerProps {
  autoplay: boolean;
  audioUrl: string;
  speed: number;
  ref?: any;
  height?: number;
  width?: number;
  onReady?: () => void;
  onClick?: (value: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const { autoplay, audioUrl, speed = 1, ...rest } = props;
  const container = useRef<HTMLDivElement>(null);
  const {
    createWavesurfer,
    play,
    pause,
    duration,
    destroyWavesurfer,
    wavesurfer
  } = useWavesurfer({
    container,
    autoplay: autoplay,
    url: audioUrl,
    audioRate: speed,
    onReady: props.onReady,
    onClick: props.onClick,
    ...rest
  });

  useImperativeHandle(ref, () => {
    return {
      play,
      pause,
      duration
    };
  });

  useEffect(() => {
    if (container.current) {
      createWavesurfer();
    }
    return () => {
      destroyWavesurfer();
    };
  }, [container.current]);
  return <div ref={container} className="audio-container"></div>;
});

export default React.memo(AudioPlayer);
