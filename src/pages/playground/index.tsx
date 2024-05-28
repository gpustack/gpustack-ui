import { Divider } from 'antd';
import { useEffect, useState } from 'react';
import GroundLeft from './components/ground-left';
import ParamsSettings from './components/params-settings';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const [messageList, setMessageList] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3:latest');
  const [showPopover, setShowPopover] = useState(false);

  const handleSelectChange = (value: string) => {
    setSelectedModel(value);
  };

  const getMessageList = () => {
    // fetch message list from server
    console.log('getModelList');
    setMessageList(['1']);
  };

  const handleTogglePopover = () => {
    setShowPopover(!showPopover);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  useEffect(() => {
    getMessageList();
  }, [selectedModel]);

  return (
    <div className="play-ground">
      <div className="chat">
        <GroundLeft></GroundLeft>
      </div>
      <div className="divider-line">
        <Divider type="vertical" />
      </div>
      <div className="params">
        <ParamsSettings onClose={handleClosePopover} />
      </div>
    </div>
  );
};

export default Playground;
