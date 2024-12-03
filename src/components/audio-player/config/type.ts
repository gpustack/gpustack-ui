export type AudioEvent =
  | 'play'
  | 'playing'
  | 'pause'
  | 'timeupdate'
  | 'ended'
  | 'loadedmetadata'
  | 'audioprocess'
  | 'canplay'
  | 'ended'
  | 'loadeddata'
  | 'seeked'
  | 'seeking'
  | 'volumechange';

export interface AudioPlayerProps {
  controls?: boolean;
  autoplay?: boolean;
  url: string;
  speed?: number;
  ref?: any;
  height?: number;
  width?: number;
  duration?: number;
  onPlay?: () => void;
  onPlaying?: () => void;
  onPause?: () => void;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
  onLoadedMetadata?: (duration: number) => void;
  onAudioProcess?: (current: number) => void;
  onCanPlay?: () => void;
  onLoadedData?: () => void;
  onSeeked?: () => void;
  onSeeking?: () => void;
  onVolumeChange?: () => void;
  onReady?: (duration: number) => void;
  onAnalyse?: (analyseData: any, frequencyBinCount: any) => void;
}
