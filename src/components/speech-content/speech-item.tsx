import IconFont from '@/components/icon-font';
import { DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import AudioPlayer from './audio-player';
import './styles/index.less';

// const audioUrl = require('./ih.mp4');

interface SpeechContentProps {
  prompt: string;
  autoplay: boolean;
  voice: string;
  format: string;
  speed: number;
  audioUrl: string;
}
const SpeechItem: React.FC<SpeechContentProps> = (props) => {
  console.log('porps=======', props);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    ref.current?.play();
  };

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div>
      <div className="speech-item">
        <div className="voice">
          <IconFont type="icon-user_voice" className="font-size-16" />
          {/* <span className="text">{props.voice}</span> */}
        </div>
        <div className="wrapper">
          <AudioPlayer
            {...props}
            audioUrl={props.audioUrl}
            ref={ref}
          ></AudioPlayer>
        </div>
      </div>
      <div className="speech-actions">
        <span className="tags">
          <span className="item">{props.format}</span>
          <span className="item splitor"></span>
          <span className="item">{props.speed}x</span>
        </span>
        <div className="actions">
          <Tooltip title="Play">
            <Button
              onClick={handlePlay}
              icon={<PlayCircleOutlined />}
              type="text"
              size="small"
            ></Button>
          </Tooltip>
          <Tooltip title="Download">
            <Button
              icon={<DownloadOutlined />}
              type="text"
              size="small"
            ></Button>
          </Tooltip>
          {/* <Tooltip title="Show Prompt">
            <Button
              icon={<FileTextOutlined />}
              type="text"
              size="small"
              onClick={handleCollapse}
            ></Button>
          </Tooltip> */}
        </div>
      </div>
      {/* {collapsed && (
        <div className="prompt-box">
          <div className="prompt">{props.prompt}</div>
        </div>
      )} */}
    </div>
  );
};

export default React.memo(SpeechItem);
