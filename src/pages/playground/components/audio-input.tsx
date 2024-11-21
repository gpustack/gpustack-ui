import { AudioOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
// import '../style/audio-input.less';

interface AudioInputProps {
  onAudioData: (audioData: {
    chunks: any[];
    url: string;
    name: string;
    duration: number;
  }) => void;
  onAnalyse?: (analyseData: any, frequencyBinCount: any) => void;
  onAudioPermission: (audioPermission: boolean) => void;
  onRecord?: (isRecording: boolean) => void;
  onStop?: () => void;
  voiceActivity?: boolean;
  type?: 'text' | 'primary' | 'default';
}

const AudioInput: React.FC<AudioInputProps> = (props) => {
  const [audioOn, setAudioOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(true);
  const audioStream = useRef<any>(null);
  const audioRecorder = useRef<any>(null);
  const startTime = useRef<number>(0);
  const audioContext = useRef<any>(null);
  const analyser = useRef<any>(null);
  const dataArray = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initAudioContext = useCallback(() => {
    audioContext.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    analyser.current = audioContext.current.createAnalyser();
    analyser.current.fftSize = 256;
    dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
  }, []);

  const generateVisualData = useCallback(() => {
    const source = audioContext.current.createMediaStreamSource(
      audioStream.current
    );
    source.connect(analyser.current);
  }, []);

  // stop all audio tracks
  const stopAudioTracks = () => {
    audioStream.current?.getTracks().forEach((track: any) => {
      track.stop();
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    audioRecorder.current?.stop();
    // props.onRecord?.(false);
  };

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
      console.log('permissionStatus:', permissionStatus);
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
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      getAudioTracks();
      setAudioOn(true);
      setAudioPermission(true);
      initAudioContext();
    } catch (error) {
      // console.log(error);
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

  // start recording
  const StartRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    try {
      await EnableAudio();
      console.log('audioStream:', audioStream.current);
      audioRecorder.current = new MediaRecorder(audioStream.current);

      const audioChunks: any[] = [];

      audioRecorder.current.ondataavailable = (event: any) => {
        audioChunks.push(event.data);
        if (props.voiceActivity) {
          analyser.current?.getByteFrequencyData(dataArray.current);

          props.onAnalyse?.(dataArray.current, analyser);
        }
      };

      // stop recording
      audioRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        handleAudioData({
          chunks: audioChunks,
          size: audioBlob.size,
          type: audioBlob.type,
          url: audioUrl,
          name: `recording-${new Date().toISOString()}.wav`,
          duration: Math.ceil((Date.now() - startTime.current) / 1000)
        });

        props.onAnalyse?.([], null);
      };

      setIsRecording(true);
      props.onRecord?.(true);
      startTime.current = Date.now();
      audioRecorder.current.start(1000);
      generateVisualData();
    } catch (error) {
      // console.log(error);
    }
  };

  useEffect(() => {
    return () => {
      handleStopRecording();
      stopAudioTracks();
    };
  }, []);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  return (
    <div className="audio-input">
      <Space size={40} className="btns">
        {
          <Tooltip title="Start Recording">
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
                danger={isRecording}
                onClick={StartRecording}
              ></Button>
            </div>
          </Tooltip>
        }
        {/* {isRecording && (
          <Tooltip title="Stop Recording">
            <Button
              shape="circle"
              icon={<IconFont type="icon-stop2"></IconFont>}
              size="middle"
              type={props.type ?? 'text'}
              onClick={stopRecording}
            ></Button>
          </Tooltip>
        )} */}
      </Space>
    </div>
  );
};

export default React.memo(AudioInput);
