import { externalRefer } from '@/constants/external-links';
import { AudioOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space, Tooltip } from 'antd';
import dayjs from 'dayjs';
import lamejs from 'lamejs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

interface AudioInputProps {
  onAudioData: (audioData: {
    chunks: any[];
    url: string;
    name: string;
    type: string;
    duration: number;
  }) => void;
  onAnalyse?: (analyseData: any, frequencyBinCount: any) => void;
  onAudioPermission: (audioPermission: boolean) => void;
  onRecord?: (isRecording: boolean) => void;
  onStop?: () => void;
  voiceActivity?: boolean;
  type?: 'text' | 'primary' | 'default';
}

const audioFormat: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'mp4',
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

const recordingFormat = {
  type: 'audio/mpeg',
  suffix: '.mp3'
};

const AudioInput: React.FC<AudioInputProps> = (props) => {
  const intl = useIntl();
  const [audioOn, setAudioOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(true);
  const audioStream = useRef<any>(null);
  const audioRecorder = useRef<any>(null);
  const startTime = useRef<number>(0);
  const audioContext = useRef<any>(null);
  const analyser = useRef<any>(null);
  const dataArray = useRef<any>(null);
  const audioUrl = useRef<string>('');
  const scriptProcessor = useRef<any>(null);
  const mp3Encoder = useRef<any>(null);
  const mp3Data = useRef<any>(null);
  const mediaStreamSource = useRef<any>(null);
  const sampleRate = 44100; // mp3

  const initAudioContext = useCallback(() => {
    audioContext.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 512;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  }, []);

  const generateVisualData = useCallback(() => {
    mediaStreamSource.current = audioContext.current.createMediaStreamSource(
      audioStream.current
    );
    mediaStreamSource.current.connect(analyser.current);
  }, []);

  const initMp3Converter = useCallback(() => {
    scriptProcessor.current = audioContext.current.createScriptProcessor(
      4096,
      1,
      1
    );

    mp3Encoder.current = new lamejs.Mp3Encoder(1, sampleRate, 128);
    mp3Data.current = [];

    scriptProcessor.current.onaudioprocess = (event: any) => {
      const pcmData = event.inputBuffer.getChannelData(0);
      const samples = new Int16Array(pcmData.length);

      for (let i = 0; i < pcmData.length; i++) {
        samples[i] = Math.max(-1, Math.min(1, pcmData[i])) * 32767;
      }
      const mp3Chunk = mp3Encoder.current.encodeBuffer(samples);
      if (mp3Chunk.length > 0) {
        mp3Data.current.push(mp3Chunk);
      }
    };

    mediaStreamSource.current.connect(scriptProcessor.current);
    scriptProcessor.current.connect(audioContext.current.destination);
  }, []);

  // stop all audio tracks
  const stopAudioTracks = () => {
    audioStream.current?.getTracks().forEach((track: any) => {
      track.stop();
    });
    scriptProcessor.current?.disconnect();
    mediaStreamSource.current?.disconnect();
    audioContext.current?.close();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    audioRecorder.current?.stop();
    stopAudioTracks();
  };

  const getAudioFormat = (type?: string) => {
    const mimeType = type || audioRecorder.current?.mimeType;

    let resultFormat = recordingFormat;

    Object.keys(audioFormat).forEach((key: string) => {
      if (mimeType.includes(key)) {
        resultFormat = {
          type: mimeType,
          suffix: `.${audioFormat[key]}`
        };
      }
    });
    return resultFormat;
  };

  const generateMp3Data = useCallback(() => {
    const finalChunk = mp3Encoder.current.flush();
    if (finalChunk.length > 0) {
      mp3Data.current.push(finalChunk);
    }
    const mp3Blob = new Blob(mp3Data.current, { type: 'audio/mpeg' });
    return mp3Blob;
  }, []);

  // get all audio tracks
  const getAudioTracks = () => {
    const audioTracks = audioStream.current.getAudioTracks();
    audioTracks.forEach((track: any) => {
      track.onended = () => {
        setAudioPermission(false);
      };
    });
  };

  // check if microphone is on
  const isMicrophoneOn = () => {
    return (
      audioStream.current &&
      audioStream.current
        .getTracks()
        .some((track: any) => track.readyState === 'live')
    );
  };

  const microphonePermissionDenied = async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'microphone' as any
    });

    return permissionStatus.state === 'denied';
  };

  const checkMicrophonePermission = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: 'microphone' as any
      });
      if (permissionStatus.state === 'granted') {
        setAudioPermission(true);
        props.onAudioPermission(true);
      } else if (permissionStatus.state === 'denied') {
        setAudioPermission(false);
        props.onAudioPermission(false);
        handleStopRecording();
      }

      permissionStatus.onchange = () => {
        console.log('permission changed');
        checkMicrophonePermission();
      };
    } catch (error) {
      // todo
    }
  };

  // open audio
  const EnableAudio = async () => {
    try {
      audioStream.current = await navigator.mediaDevices?.getUserMedia({
        audio: true
      });
      getAudioTracks();
      setAudioOn(true);
      setAudioPermission(true);
      initAudioContext();
      generateVisualData();
      initMp3Converter();
    } catch (error) {
      console.log('enable+++++++++', error);
    }
  };

  // close audio
  const disableAudio = () => {
    stopAudioTracks();
    setAudioOn(false);
    handleStopRecording();
    audioStream.current = null;
  };

  const stopRecording = () => {
    audioRecorder.current?.stop();
    setIsRecording(false);
    props.onRecord?.(false);
  };

  const handleAudioData = (audioData: any) => {
    props.onAudioData?.(audioData);
  };

  const generateFileNameByTime = (type?: string) => {
    const format = getAudioFormat(type);
    return `Recording-${dayjs().format('YYYY-MM-DD-HH_mm_ss')}${format.suffix}`;
  };
  // start recording
  const StartRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      await EnableAudio();

      URL.revokeObjectURL(audioUrl.current);

      audioRecorder.current = new MediaRecorder(audioStream.current);

      audioRecorder.current.ondataavailable = (event: any) => {
        if (props.voiceActivity) {
          analyser.current?.getByteFrequencyData(dataArray.current);
          props.onAnalyse?.(dataArray.current, analyser);
        }
      };

      // stop recording
      audioRecorder.current.onstop = async () => {
        handleStopRecording();
        props.onAnalyse?.([], null);

        const mp3Blob = generateMp3Data();

        audioUrl.current = mp3Blob.size ? URL.createObjectURL(mp3Blob) : '';

        handleAudioData({
          chunks: mp3Blob,
          size: mp3Blob.size,
          type: mp3Blob.type,
          url: audioUrl.current,
          name: generateFileNameByTime(mp3Blob.type),
          duration: Math.floor((Date.now() - startTime.current) / 1000)
        });
      };

      setIsRecording(true);
      props.onRecord?.(true);
      startTime.current = Date.now();
      audioRecorder.current.start(100);
    } catch (error) {
      console.log('error====', error);
    }
  };

  const renderRecordButtonTips = useMemo(() => {
    if (!audioPermission) {
      return (
        <span>
          <span>
            {intl.formatMessage({ id: 'playground.audio.enablemic' })}
            <Button
              size="small"
              color="primary"
              variant="link"
              href={`${externalRefer.audioPermission}`}
              target="_blank"
              style={{
                paddingInline: 0
              }}
            >
              {intl.formatMessage({ id: 'playground.audio.enablemic.doc' })}
            </Button>
          </span>
        </span>
      );
    }
    return isRecording
      ? intl.formatMessage({ id: 'playground.audio.stoprecord' })
      : intl.formatMessage({ id: 'playground.audio.startrecord' });
  }, [audioPermission, isRecording, intl]);

  const noAudioPermissionButtonStyle = useMemo(() => {
    if (!audioPermission) {
      return {
        backgroundColor: 'var(--ant-color-error-bg-filled-hover)',
        color: 'var(--ant-color-error-border-hover)',
        border: 'none'
      };
    }
    return {};
  }, [audioPermission]);

  useEffect(() => {
    return () => {
      handleStopRecording();
      stopAudioTracks();
      URL.revokeObjectURL(audioUrl.current);
    };
  }, []);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  return (
    <div className="audio-input">
      <Space size={40} className="btns">
        {
          <Tooltip title={renderRecordButtonTips}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}
            >
              <Button
                disabled={!audioPermission}
                shape="circle"
                icon={<AudioOutlined />}
                size="middle"
                type={props.type ?? 'text'}
                style={{
                  ...noAudioPermissionButtonStyle
                }}
                danger={isRecording}
                onClick={StartRecording}
              ></Button>
            </div>
          </Tooltip>
        }
      </Space>
    </div>
  );
};

export default AudioInput;
