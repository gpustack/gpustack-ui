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
}

const AudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const { autoplay, audioUrl, speed = 1, ...rest } = props;
  const container = useRef<HTMLDivElement>(null);
  const { createWavesurfer, play, pause, destroyWavesurfer, wavesurfer } =
    useWavesurfer({
      container,
      autoplay: autoplay,
      url: audioUrl,
      audioRate: speed,
      ...rest
    });

  useImperativeHandle(ref, () => {
    return {
      play,
      pause
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
