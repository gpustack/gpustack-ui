import IconFont from '@/components/icon-font';
import breakpoints from '@/config/breakpoints';
import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { DiffOutlined, HighlightOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Segmented, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { queryModelsList } from './apis';
import GroundImages from './components/ground-images';
import ImageEdit from './components/image-edit';
import './style/play-ground.less';

const TabsValueMap = {
  Tab1: 'generate',
  Tab2: 'edit'
};

const TextToImages: React.FC = () => {
  const intl = useIntl();
  const { size } = useWindowResize();
  const [activeKey, setActiveKey] = useState(TabsValueMap.Tab1);
  const groundTabRef1 = useRef<any>(null);
  const groundTabRef2 = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [loaded, setLoaded] = useState(false);

  const optionsList = [
    {
      label: 'Generate',
      value: TabsValueMap.Tab1,
      icon: <DiffOutlined />
    },
    {
      label: 'Edit',
      value: TabsValueMap.Tab2,
      icon: <HighlightOutlined />
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
      key: TabsValueMap.Tab1,
      label: 'Generate',
      children: (
        <GroundImages ref={groundTabRef1} modelList={modelList}></GroundImages>
      )
    },
    {
      key: TabsValueMap.Tab2,
      label: 'Edit',
      children: <ImageEdit modelList={modelList} ref={groundTabRef2} />
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
          image_only: true
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
              {intl.formatMessage({ id: 'menu.playground.text2images' })}
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
      className={classNames('playground-container chat')}
    >
      <div className="play-ground">
        <div className="chat">
          <Tabs items={items} activeKey={activeKey}></Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

export default TextToImages;
