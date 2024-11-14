import { useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface Options {
  container: React.RefObject<HTMLDivElement>;
  waveColor?: string;
  progressColor?: string;
  url: string;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  autoplay?: boolean;
  audioRate?: number;
}
const useWavesurfer = (options: Options) => {
  const wavesurfer = useRef<WaveSurfer | null>(null);

  const { container, url, ...rest } = options;

  const createWavesurfer = () => {
    if (!container.current) {
      return;
    }
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }
    wavesurfer.current = WaveSurfer.create({
      container: container.current,
      waveColor: '#4096ff',
      progressColor: 'rgb(100, 0, 100)',
      url: url,
      height: 60,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: true,
      cursorWidth: 0,
      ...rest
    });
  };

  const destroyWavesurfer = () => {
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }
  };

  const play = () => {
    if (wavesurfer.current) {
      wavesurfer.current.play();
    }
  };

  const pause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.pause();
    }
  };

  return {
    createWavesurfer,
    play,
    pause,
    destroyWavesurfer
  };
};

export default useWavesurfer;
