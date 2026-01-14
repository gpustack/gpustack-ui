import HotKeys from '@/config/hotkeys';
import { ExtraContent } from '@/layouts/extraRender';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Divider } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { PageContainerInner } from '../_components/page-box';
import { queryModelsList } from './apis';
import GroundVideo from './components/ground-video';
import ViewCodeButtons from './components/view-code-buttons';
import useCollapseLayout from './hooks/use-collapse-layout';
import './style/play-ground.less';

const PlaygroundRerank: React.FC = () => {
  const intl = useIntl();
  const groundVideoRef = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [loaded, setLoaded] = useState(false);

  useCollapseLayout({
    handler: () => {
      groundVideoRef.current?.setCollapse?.();
    },
    triggeredRef: groundVideoRef.current
  });

  const handleViewCode = useMemoizedFn(() => {
    groundVideoRef.current?.viewCode?.();
  });

  const handleToggleCollapse = useMemoizedFn(() => {
    groundVideoRef.current?.setCollapse?.();
  });

  useEffect(() => {
    const getModelList = async () => {
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
        return list;
      } catch (error) {
        console.error(error);
        return [];
      }
    };
    const fetchData = async () => {
      try {
        const [modelList] = await Promise.all([getModelList()]);
        setModelList(modelList);
      } catch (error) {
        setLoaded(true);
      }
    };
    fetchData();
  }, []);

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      groundVideoRef.current?.setCollapse?.();
    },
    {
      preventDefault: true
    }
  );

  return (
    <PageContainerInner
      className={classNames('playground-container chat')}
      extra={[
        <ViewCodeButtons
          activeKey=""
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          key="view-code-buttons"
        ></ViewCodeButtons>,
        <Divider
          key="divider"
          orientation="vertical"
          style={{ height: 16, marginInline: 16 }}
        />,
        <ExtraContent key="extra-content" />
      ]}
    >
      <div className="play-ground">
        <div className="chat">
          <GroundVideo
            ref={groundVideoRef}
            modelList={modelList}
            loaded={loaded}
          ></GroundVideo>
        </div>
      </div>
    </PageContainerInner>
  );
};

export default PlaygroundRerank;
