import IconFont from '@/components/icon-font';
import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { queryModelsList as queryGPUStackModels } from '@/pages/llmodels/apis';
import { AudioOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Segmented, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { queryModelsList } from './apis';
import GroundSTT from './components/ground-stt';
import GroundTTS from './components/ground-tts';
import './style/play-ground.less';

const TabsValueMap = {
  Tab1: 'tts',
  Tab2: 'stt'
};

const Playground: React.FC = () => {
  const intl = useIntl();
  const { size } = useWindowResize();
  const [activeKey, setActiveKey] = useState(TabsValueMap.Tab1);
  const groundTabRef1 = useRef<any>(null);
  const groundTabRef2 = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const optionsList = [
    {
      label: intl.formatMessage({ id: 'playground.audio.texttospeech' }),
      value: TabsValueMap.Tab1,
      icon: <AudioOutlined />
    },
    {
      label: intl.formatMessage({ id: 'playground.audio.speechtotext' }),
      value: TabsValueMap.Tab2,
      icon: <IconFont type={'icon-audio'}></IconFont>
    }
  ];

  const handleViewCode = useCallback(() => {
    if (activeKey === TabsValueMap.Tab1) {
      groundTabRef1.current?.viewCode?.();
    } else if (activeKey === TabsValueMap.Tab2) {
      groundTabRef2.current?.viewCode?.();
    }
  }, [activeKey]);

  const handleToggleCollapse = useCallback(() => {
    if (activeKey === TabsValueMap.Tab1) {
      groundTabRef1.current?.setCollapse?.();
      return;
    }
    groundTabRef2.current?.setCollapse?.();
  }, [activeKey]);

  const items: TabsProps['items'] = [
    {
      key: 'tts',
      label: 'TTS',
      children: (
        <GroundTTS ref={groundTabRef1} modelList={modelList}></GroundTTS>
      )
    },
    {
      key: 'stt',
      label: 'Realtime',
      children: (
        <GroundSTT modelList={modelList} loaded={loaded} ref={groundTabRef2} />
      )
    }
  ];

  useEffect(() => {
    if (size.width < breakpoints.lg) {
      if (!groundTabRef1.current?.collapse) {
        groundTabRef1.current?.setCollapse?.();
      }
    }
  }, [size.width]);

  useEffect(() => {
    const getModelList = async () => {
      try {
        const params = {
          embedding_only: false
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

    const getGpuStackModels = async () => {
      try {
        const res: any = await queryGPUStackModels({ page: 1, perPage: 100 });
        return res.items || [];
      } catch (error) {
        return [];
      }
    };

    const fetchData = async () => {
      try {
        const [modelist, list] = await Promise.all([
          getModelList(),
          getGpuStackModels()
        ]);
        const dataMap = list.reduce((acc: any, cur: any) => {
          acc[cur.name] = cur;
          return acc;
        }, {});
        const dataList = modelist.map((item: any) => {
          item.modelId = dataMap[item.value]?.id;
          return item;
        });
        setModelList(dataList);
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
      groundTabRef1.current?.setCollapse?.();
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
              {intl.formatMessage({ id: 'menu.playground.speech' })}
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
