import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import { AudioPlayerProps } from './config/type';

const RawAudioPlayer: React.FC<AudioPlayerProps> = forwardRef((props, ref) => {
  const { autoplay = false } = props;
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // =================== audio context ======================
  const audioContext = useRef<any>(null);
  const analyser = useRef<any>(null);
  const dataArray = useRef<any>(null);
  // ========================================================

  const initAudioContext = useCallback(() => {
    audioContext.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 512;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  }, []);

  const generateVisualData = useCallback(() => {
    const source = audioContext.current.createMediaElementSource(
      audioRef.current
    );
    source.connect(analyser.current);
    analyser.current.connect(audioContext.current.destination);
  }, []);

  const initEnvents = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.addEventListener('complete', () => {});

    audioRef.current.addEventListener('play', () => {
      props.onAnalyse?.(dataArray.current, analyser);
      props.onPlay?.();
    });

    audioRef.current.addEventListener('pause', () => {
      props.onAnalyse?.(dataArray.current, analyser);
      props.onPause?.();
    });

    audioRef.current.addEventListener('timeupdate', () => {
      const current = audioRef.current?.currentTime || 0;
      props.onTimeUpdate?.();
      props.onAudioProcess?.(current);
    });

    audioRef.current.addEventListener('ended', () => {
      props.onEnded?.();
    });
    // add all other events

    audioRef.current.addEventListener('canplay', () => {
      props.onCanPlay?.();
    });

    audioRef.current.addEventListener('loadeddata', () => {
      initEnvents();
      if (!audioContext.current) {
        initAudioContext();
        generateVisualData();
      }
      props.onLoadedData?.();
    });

    audioRef.current.addEventListener('seeked', () => {
      props.onSeeked?.();
    });

    audioRef.current.addEventListener('seeking', () => {
      props.onSeeking?.();
    });

    audioRef.current.addEventListener('volumechange', () => {
      props.onVolumeChange?.();
    });

    audioRef.current.addEventListener('playing', () => {
      props.onPlaying?.();
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      const duration = audioRef.current?.duration || 0;
      props.onLoadedMetadata?.(duration);
      props.onReady?.(duration);
    });

    audioRef.current.addEventListener('ended', () => {
      props.onEnded?.();
    });

    audioRef.current.addEventListener('loadeddata', () => {
      props.onLoadedData?.();
    });
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current) {
        // If playback has ended, reset to beginning
        if (audioRef.current.currentTime >= audioRef.current.duration) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play();
      }
    },
    pause: () => {
      audioRef.current?.pause();
    },
    seekTo: (ratio: number) => {
      if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = ratio * audioRef.current.duration;
      }
    },
    // Compatibility layer for wavesurfer interface
    wavesurfer: {
      current: {
        play: () => {
          if (audioRef.current) {
            // If playback has ended, reset to beginning
            if (audioRef.current.currentTime >= audioRef.current.duration) {
              audioRef.current.currentTime = 0;
            }
            return audioRef.current.play();
          }
          return Promise.resolve();
        },
        isPlaying: () => {
          return audioRef.current ? !audioRef.current?.paused : false;
        }
      }
    }
  }));

  useEffect(() => {
    if (audioRef.current) {
      initEnvents();
    }
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      // remove all events

      audioRef.current?.removeEventListener('play', () => {});
      audioRef.current?.removeEventListener('pause', () => {});
      audioRef.current?.removeEventListener('timeupdate', () => {});
      audioRef.current?.removeEventListener('ended', () => {});
      audioRef.current?.removeEventListener('canplay', () => {});
      audioRef.current?.removeEventListener('loadeddata', () => {});
      audioRef.current?.removeEventListener('seeked', () => {});
      audioRef.current?.removeEventListener('seeking', () => {});
      audioRef.current?.removeEventListener('volumechange', () => {});
      audioRef.current?.removeEventListener('playing', () => {});
      audioRef.current?.removeEventListener('loadedmetadata', () => {});
      audioRef.current?.removeEventListener('ended', () => {});
      audioRef.current?.removeEventListener('loadeddata', () => {});
    };
  }, [audioRef.current]);

  // Reload audio when URL changes
  useEffect(() => {
    if (audioRef.current && props.url) {
      audioRef.current.load();
    }
  }, [props.url]);

  return (
    <audio
      controls
      autoPlay={autoplay}
      src={props.url}
      ref={audioRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        opacity: 0
      }}
      preload="metadata"
    ></audio>
  );
});

export default RawAudioPlayer;
