import IconFont from '@/components/icon-font';
import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { MessageOutlined, OneToOneOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Segmented, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { queryModelsList } from './apis';
import GroundLeft from './components/ground-left';
import MultipleChat from './components/multiple-chat';
import './style/play-ground.less';

const Playground: React.FC = () => {
  const intl = useIntl();
  const { size } = useWindowResize();
  const [activeKey, setActiveKey] = useState('chat');
  const groundLeftRef = useRef<any>(null);
  const groundRerankerRef = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const optionsList = [
    {
      label: intl.formatMessage({ id: 'menu.playground.chat' }),
      value: 'chat',
      icon: <MessageOutlined />
    },
    {
      label: intl.formatMessage({ id: 'menu.compare' }),
      value: 'compare',
      icon: <OneToOneOutlined />
    }
  ];

  const handleViewCode = useCallback(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.viewCode?.();
    } else if (activeKey === 'chat') {
      groundLeftRef.current?.viewCode?.();
    }
  }, [groundLeftRef, groundRerankerRef, activeKey]);

  const handleToggleCollapse = useCallback(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.setCollapse?.();
      return;
    }
    groundLeftRef.current?.setCollapse?.();
  }, [groundLeftRef, groundRerankerRef, activeKey]);

  const items: TabsProps['items'] = [
    {
      key: 'chat',
      label: 'Chat',
      children: (
        <GroundLeft ref={groundLeftRef} modelList={modelList}></GroundLeft>
      )
    },
    {
      key: 'compare',
      label: 'Compare',
      children: <MultipleChat modelList={modelList} loaded={loaded} />
    }
  ];

  useEffect(() => {
    if (size.width < breakpoints.lg) {
      if (!groundLeftRef.current?.collapse) {
        groundLeftRef.current?.setCollapse?.();
      }
    }
  }, [size.width]);

  useEffect(() => {
    const getModelList = async () => {
      try {
        const params = {
          categories: ''
        };
        const res = await queryModelsList(params);
        const list = _.map(res.data || [], (item: any) => {
          return {
            value: item.id,
            label: item.id
          };
        }) as Global.BaseOption<string>[];
        return list;
      } catch (error) {
        console.error(error);
        return [];
      }
    };

    const fetchData = async () => {
      try {
        const modelist = await getModelList();
        setModelList(modelist);
      } catch (error) {
        setLoaded(true);
      }
    };
    fetchData();
  }, []);

  const renderExtra = () => {
    if (activeKey === 'compare') {
      return false;
    }
    return (
      <Space key="buttons">
        <Button
          size="middle"
          onClick={handleViewCode}
          icon={<IconFont type="icon-code" className="font-size-16"></IconFont>}
        >
          {intl.formatMessage({ id: 'playground.viewcode' })}
        </Button>
        <Button
          size="middle"
          onClick={handleToggleCollapse}
          icon={
            <IconFont
              type="icon-a-layout6-line"
              className="font-size-16"
            ></IconFont>
          }
        ></Button>
      </Space>
    );
  };

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      groundLeftRef.current?.setCollapse?.();
    },
    {
      preventDefault: true
    }
  );

  return (
    <PageContainer
      ghost
      header={{
        title: (
          <div className="flex items-center">
            <span className="font-600">
              {intl.formatMessage({ id: 'menu.playground.chat' })}
            </span>
            {
              <Segmented
                options={optionsList}
                size="middle"
                className="m-l-40"
                onChange={(key) => setActiveKey(key)}
              ></Segmented>
            }
          </div>
        ),
        breadcrumb: {}
      }}
      extra={renderExtra()}
      className={classNames('playground-container', {
        compare: activeKey === 'compare',
        chat: activeKey !== 'compare'
      })}
    >
      <div className="play-ground">
        <div className="chat">
          <Tabs items={items} activeKey={activeKey}></Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

export default Playground;
