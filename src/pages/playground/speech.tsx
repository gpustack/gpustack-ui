import IconFont from '@/components/icon-font';
import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { AudioOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Segmented, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { queryModelsList } from './apis';
import GroundSTT from './components/ground-stt';
import GroundTTS from './components/ground-tts';
import './style/play-ground.less';

const TabsValueMap = {
  Tab1: 'tts',
  Tab2: 'stt',
  tts: 'tts',
  stt: 'stt'
};

const Playground: React.FC = () => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const modelType = searchParams.get('type') || '';
  const { size } = useWindowResize();
  const [activeKey, setActiveKey] = useState(modelType || TabsValueMap.Tab1);
  const groundTabRef1 = useRef<any>(null);
  const groundTabRef2 = useRef<any>(null);
  const [textToSpeechModels, setTextToSpeechModels] = useState<
    Global.BaseOption<string>[]
  >([]);
  const [speechModelList, setSpeechModelList] = useState<
    Global.BaseOption<string>[]
  >([]);

  const optionsList = useMemo(() => {
    return [
      {
        label: intl.formatMessage({ id: 'playground.audio.texttospeech' }),
        value: TabsValueMap.Tab1,
        icon: <IconFont type={'icon-audio'}></IconFont>
      },
      {
        label: intl.formatMessage({ id: 'playground.audio.speechtotext' }),
        value: TabsValueMap.Tab2,
        icon: <AudioOutlined />
      }
    ];
  }, [intl]);

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

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'tts',
        label: 'TTS',
        children: (
          <GroundTTS
            ref={groundTabRef1}
            modelList={textToSpeechModels}
          ></GroundTTS>
        )
      },
      {
        key: 'stt',
        label: 'Realtime',
        children: <GroundSTT modelList={speechModelList} ref={groundTabRef2} />
      }
    ];
  }, [textToSpeechModels, speechModelList]);

  useEffect(() => {
    if (size.width < breakpoints.lg) {
      if (!groundTabRef1.current?.collapse) {
        groundTabRef1.current?.setCollapse?.();
      }
      if (!groundTabRef2.current?.collapse) {
        groundTabRef2.current?.setCollapse?.();
      }
    }
  }, [size.width]);

  useEffect(() => {
    const getTextToSpeechModels = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.text_to_speech,
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
        return list;
      } catch (error) {
        console.error(error);
        return [];
      }
    };
    const getSpeechToText = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.speech_to_text,
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
        return list;
      } catch (error) {
        console.error(error);
        return [];
      }
    };

    const fetchData = async () => {
      try {
        const [textToSpeechModels, speechToTextModels] = await Promise.all([
          getTextToSpeechModels(),
          getSpeechToText()
        ]);

        setTextToSpeechModels(textToSpeechModels);
        setSpeechModelList(speechToTextModels);
      } catch (error) {
        // error
      }
    };
    fetchData();
  }, []);

  const renderExtra = useMemo(() => {
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
  }, [handleToggleCollapse, handleViewCode, intl]);

  const header = useMemo(() => {
    return {
      title: (
        <div className="flex items-center">
          <span className="font-600">
            {intl.formatMessage({ id: 'menu.playground.speech' })}
          </span>
          {
            <Segmented
              options={optionsList}
              size="middle"
              className="m-l-40 font-600"
              value={activeKey}
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
  }, [activeKey, optionsList]);

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
