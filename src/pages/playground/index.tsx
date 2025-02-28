import IconFont from '@/components/icon-font';
import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { MessageOutlined, OneToOneOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Segmented, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const optionsList = useMemo(() => {
    return [
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
  }, [intl]);

  const handleViewCode = useCallback(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.viewCode?.();
    } else if (activeKey === 'chat') {
      groundLeftRef.current?.viewCode?.();
    }
  }, [activeKey]);

  const handleToggleCollapse = useCallback(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.setCollapse?.();
      return;
    }
    groundLeftRef.current?.setCollapse?.();
  }, [activeKey]);

  const items: TabsProps['items'] = useMemo(() => {
    return [
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
  }, [modelList, loaded]);

  useEffect(() => {
    if (size.width < breakpoints.lg && !groundLeftRef.current?.collapse) {
      groundLeftRef.current?.setCollapse?.();
    }
  }, [size.width]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.llm,
          with_meta: true
        };
        const res = await queryModelsList(params);
        const list = _.map(res.data || [], (item: any) => {
          return {
            value: item.id,
            label: item.id,
            meta: item.meta
          };
        }) as Global.BaseOption<string>[];
        setModelList(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const renderExtra = useMemo(() => {
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
  }, [activeKey, intl, handleViewCode, handleToggleCollapse]);

  const header = useMemo(() => {
    return {
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
      style: {
        paddingInline: 'var(--layout-content-header-inlinepadding)'
      },
      breadcrumb: {}
    };
  }, [optionsList]);

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      if (activeKey === 'chat') {
        groundLeftRef.current?.setCollapse?.();
      }
    },
    {
      preventDefault: true
    }
  );

  return (
    <PageContainer
      ghost
      header={header}
      extra={renderExtra}
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
