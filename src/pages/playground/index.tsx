import { useSearchParams } from '@umijs/max';
import { useState } from 'react';
import GroundLeft from './components/ground-left';
import ParamsSettings from './components/params-settings';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedModel, setSelectedModel] = useState('llama3:latest');
  const [showPopover, setShowPopover] = useState(false);
  const selectModel = searchParams.get('model') || '';
  const [params, setParams] = useState({});

  console.log('query======', searchParams, selectModel);
  const handleSelectChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleTogglePopover = () => {
    setShowPopover(!showPopover);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  return (
    <div className="play-ground">
      <div className="chat">
        <GroundLeft parameters={params}></GroundLeft>
      </div>
      <div className="divider-line">{/* <Divider type="vertical" /> */}</div>
      <div className="params">
        <ParamsSettings
          onClose={handleClosePopover}
          setParams={setParams}
          selectedModel={selectModel}
        />
      </div>
    </div>
  );
};

export default Playground;
