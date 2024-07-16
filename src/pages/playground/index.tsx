import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { Divider } from 'antd';
import { useState } from 'react';
import GroundLeft from './components/ground-left';
import ParamsSettings from './components/params-settings';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [params, setParams] = useState({});

  return (
    <>
      <PageContainer ghost extra={[]}>
        <div className="play-ground">
          <div className="chat">
            <GroundLeft parameters={params}></GroundLeft>
          </div>
          <div className="divider-line">
            <Divider type="vertical" />
          </div>

          <div className="params">
            <ParamsSettings setParams={setParams} selectedModel={selectModel} />
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default Playground;
