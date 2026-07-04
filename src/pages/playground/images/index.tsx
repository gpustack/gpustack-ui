import HotKeys from '@/config/hotkeys';
import useWindowResize from '@/hooks/use-window-resize';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { DiffOutlined, HighlightOutlined } from '@ant-design/icons';
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
import ViewCodeButtons from '../components/view-code-buttons';
import '../style/play-ground.less';
import ImageCreate from './create';
import ImageEdit from './edit';

const TabsValueMap = {
  Tab1: 'generate',
  Tab2: 'edit'
};

const TextToImages: React.FC = () => {
  const intl = useIntl();
  const { isMobile } = useWindowResize();
  const [activeKey, setActiveKey] = useState(TabsValueMap.Tab1);
  const groundTabRef1 = useRef<any>(null);
  const groundTabRef2 = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);

  const optionsList = useMemo(() => {
    return [
      {
        label: intl.formatMessage({ id: 'playground.image.generate' }),
        value: TabsValueMap.Tab1,
        icon: <DiffOutlined />
      },
      {
        label: intl.formatMessage({ id: 'playground.image.edit' }),
        value: TabsValueMap.Tab2,
        icon: <HighlightOutlined />
      }
    ];
  }, [intl]);

  const handleViewCode = useMemoizedFn(() => {
    if (activeKey === TabsValueMap.Tab1) {
      groundTabRef1.current?.viewCode?.();
    } else if (activeKey === TabsValueMap.Tab2) {
      groundTabRef2.current?.viewCode?.();
    }
  });

  const handleToggleCollapse = useMemoizedFn(() => {
    if (activeKey === TabsValueMap.Tab1) {
      groundTabRef1.current?.setCollapse?.();
      return;
    }
    groundTabRef2.current?.setCollapse?.();
  });

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: TabsValueMap.Tab1,
        label: 'Generate',
        children: (
          <ImageCreate ref={groundTabRef1} modelList={modelList}></ImageCreate>
        )
      },
      {
        key: TabsValueMap.Tab2,
        label: 'Edit',
        children: <ImageEdit modelList={modelList} ref={groundTabRef2} />
      }
    ];
  }, [modelList]);

  useEffect(() => {
    const getModelList = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.image,
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
        const modelist = await getModelList();
        setModelList(modelist);
      } catch (error) {
        // error
      }
    };
    fetchData();
  }, []);

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      groundTabRef1.current?.setCollapse?.();
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
          title={intl.formatMessage({ id: 'menu.playground.text2images' })}
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
        ></ViewCodeButtons>
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

export default TextToImages;
