import React from 'react';
import SpeechItem from './speech-item';

interface SpeechContentProps {
  dataList: any[];
  loading?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  playerRef?: React.RefObject<any>;
  isPlaying?: boolean;
  isStream?: boolean;
  analyserData?: {
    data: Uint8Array;
    analyser: any;
  };
}

const SpeechContent: React.FC<SpeechContentProps> = (props) => {
  return (
    <div>
      {props.dataList.map((item) => (
        <SpeechItem
          key={item.uid}
          {...item}
          isStream={props.isStream}
          isPlaying={props.isPlaying}
          onPlay={props.onPlay}
          onPause={props.onPause}
          playerRef={props.playerRef}
          analyserData={props.analyserData}
        />
      ))}
    </div>
  );
};

export default SpeechContent;
