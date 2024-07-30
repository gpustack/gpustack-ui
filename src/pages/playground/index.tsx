import IconFont from '@/components/icon-font';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Divider } from 'antd';
import classNames from 'classnames';
import { useRef, useState } from 'react';
import GroundLeft from './components/ground-left';
import ParamsSettings from './components/params-settings';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [params, setParams] = useState({});
  const [collapse, setCollapse] = useState(false);
  const groundLeftRef = useRef<any>(null);

  const handleViewCode = () => {
    groundLeftRef.current?.viewCode?.();
  };

  return (
    <PageContainer
      ghost
      extra={[
        <>
          <Button
            size="middle"
            onClick={handleViewCode}
            icon={
              <IconFont type="icon-code" className="font-size-16"></IconFont>
            }
          >
            {intl.formatMessage({ id: 'playground.viewcode' })}
          </Button>
          <Button
            size="middle"
            className="m-l-5"
            onClick={() => setCollapse(!collapse)}
            icon={
              <IconFont
                type="icon-a-layout6-line"
                className="font-size-16"
              ></IconFont>
            }
          ></Button>
        </>
      ]}
      className="playground-container"
    >
      <div className="play-ground">
        <div className="chat">
          <GroundLeft parameters={params} ref={groundLeftRef}></GroundLeft>
        </div>
        <div
          className={classNames('left', {
            collapse: collapse
          })}
        >
          {/* <Button
            onClick={() => setCollapse(!collapse)}
            icon={collapse ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            style={{ color: 'var(--ant-color-text-tertiary)' }}
            size="small"
            type="text"
            className="collapse-btn"
          ></Button> */}
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
