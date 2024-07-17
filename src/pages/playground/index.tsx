import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { Button, Divider } from 'antd';
import classNames from 'classnames';
import { useState } from 'react';
import GroundLeft from './components/ground-left';
import ParamsSettings from './components/params-settings';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [params, setParams] = useState({});
  const [collapse, setCollapse] = useState(false);

  return (
    <PageContainer ghost extra={[]} className="playground-container">
      <div className="play-ground">
        <div className="chat">
          <GroundLeft parameters={params}></GroundLeft>
        </div>
        <div
          className={classNames('left', {
            collapse: collapse
          })}
        >
          <Button
            onClick={() => setCollapse(!collapse)}
            icon={collapse ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            style={{ color: 'var(--ant-color-text-tertiary)' }}
            size="small"
            type="text"
            className="collapse-btn"
          ></Button>
          <div
            className={classNames('divider-line', {
              collapse: collapse
            })}
          >
            <Divider type="vertical" />
          </div>
          <div className={classNames('params')}>
            <div
              className={classNames('params-box', {
                collapse: collapse
              })}
            >
              <ParamsSettings
                setParams={setParams}
                selectedModel={selectModel}
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Playground;
