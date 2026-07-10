import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { MessageOutlined, OneToOneOutlined } from '@ant-design/icons';
import { PageHeaderTitle, ResponsiveSegmented } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Tabs, TabsProps } from 'antd';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  HeaderLeft,
  HeaderRight,
  usePageContentStyle
} from '../../_components/page-box';
import { queryModelsList } from '../apis';
import MultipleChat from '../components/multiple-chat';
import ViewCodeButtons from '../components/view-code-buttons';
import '../style/play-ground.less';
import SingleChat from './single-chat';

const Playground: React.FC = () => {
  const intl = useIntl();
  const { isMobile } = useWindowResize();
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

  usePageContentStyle(
    isMobile
      ? {
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }
      : { padding: 0 }
  );

  return (
    <>
      <HeaderLeft>
        <PageHeaderTitle
          title={intl.formatMessage({ id: 'menu.playground.chat' })}
        >
          <ResponsiveSegmented
            options={optionsList}
            value={activeKey}
            onChange={(key) => setActiveKey(key)}
          />
        </PageHeaderTitle>
      </HeaderLeft>
      <HeaderRight>
        <ViewCodeButtons
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          activeKey={activeKey}
          key="view-code-buttons"
        />
      </HeaderRight>
      <div
        className={
          isMobile
            ? 'play-ground-root play-ground-root--mobile'
            : 'play-ground-root'
        }
      >
        <div className="play-ground">
          <div className="chat">
            <Tabs items={items} activeKey={activeKey}></Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Playground;
