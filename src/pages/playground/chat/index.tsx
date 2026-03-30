import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { MessageOutlined, OneToOneOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Segmented, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { PageContainerInner } from '../../_components/page-box';
import { queryModelsList } from '../apis';
import MultipleChat from '../components/multiple-chat';
import ViewCodeButtons from '../components/view-code-buttons';
import '../style/play-ground.less';
import SingleChat from './single-chat';

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

  const handleViewCode = useMemoizedFn(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.viewCode?.();
    } else if (activeKey === 'chat') {
      groundLeftRef.current?.viewCode?.();
    }
  });

  const handleToggleCollapse = useMemoizedFn(() => {
    if (activeKey === 'reranker') {
      groundRerankerRef.current?.setCollapse?.();
      return;
    }
    groundLeftRef.current?.setCollapse?.();
  });

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'chat',
        label: 'Chat',
        icon: <MessageOutlined />,
        children: (
          <SingleChat ref={groundLeftRef} modelList={modelList}></SingleChat>
        )
      },
      {
        key: 'compare',
        label: 'Compare',
        icon: <OneToOneOutlined />,
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

  const title = useMemo(() => {
    return (
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-600 flex-center">
            {intl.formatMessage({ id: 'menu.playground.chat' })}
          </span>
          {
            <Segmented
              options={optionsList}
              size="middle"
              className="m-l-24 font-600"
              value={activeKey}
              onChange={(key) => setActiveKey(key)}
            ></Segmented>
          }
        </div>
        <ViewCodeButtons
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          activeKey={activeKey}
          key="view-code-buttons"
        />
      </div>
    );
  }, [activeKey, optionsList, intl]);

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
    <PageContainerInner
      className={classNames('playground-container', {
        compare: activeKey === 'compare',
        chat: activeKey !== 'compare'
      })}
      styles={{
        containerWrapper: {
          padding: 0
        }
      }}
      leftContent={
        <div className="flex items-center">
          <span className="font-600 flex-center">
            {intl.formatMessage({ id: 'menu.playground.chat' })}
          </span>
          {
            <Segmented
              shape="round"
              style={{
                backgroundColor: 'var(--ant-color-fill-secondary)'
              }}
              size="middle"
              className="m-l-24 font-400"
              options={optionsList}
              value={activeKey}
              onChange={(key) => setActiveKey(key)}
            ></Segmented>
          }
        </div>
      }
      rightContent={
        <ViewCodeButtons
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          activeKey={activeKey}
          key="view-code-buttons"
        />
      }
    >
      <div className="play-ground">
        <div className="chat">
          <Tabs items={items} activeKey={activeKey}></Tabs>
        </div>
      </div>
    </PageContainerInner>
  );
};

export default Playground;
