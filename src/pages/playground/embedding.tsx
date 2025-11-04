import HotKeys from '@/config/hotkeys';
import { ExtraContent } from '@/layouts/extraRender';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Divider } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { PageContainerInner } from '../_components/page-box';
import { queryModelsList } from './apis';
import GroundEmbedding from './components/ground-embedding';
import ViewCodeButtons from './components/view-code-buttons';
import useCollapseLayout from './hooks/use-collapse-layout';
import './style/play-ground.less';

const PlaygroundEmbedding: React.FC = () => {
  const intl = useIntl();
  const groundLeftRef = useRef<any>(null);
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [loaded, setLoaded] = useState(false);

  useCollapseLayout({
    handler: () => {
      groundLeftRef.current?.setCollapse?.();
      groundLeftRef.current?.calculateNewMaxFromBoundary?.(500, 300);
    },
    triggeredRef: groundLeftRef.current
  });

  const handleViewCode = useMemoizedFn(() => {
    groundLeftRef.current?.viewCode?.();
  });
  const handleToggleCollapse = useMemoizedFn(() => {
    groundLeftRef.current?.setCollapse?.();
  });

  useEffect(() => {
    const getModelListByEmbedding = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.embedding,
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
        const [dataList] = await Promise.all([getModelListByEmbedding()]);
        setModelList(dataList);
      } catch (error) {
        setLoaded(true);
      }
    };
    fetchData();
  }, []);

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
    <PageContainerInner
      className={classNames('playground-container chat')}
      extra={[
        <ViewCodeButtons
          activeKey=""
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          key="view-code-buttons"
        />,
        <Divider
          key="divider"
          type="vertical"
          style={{ height: 24, marginInline: 16 }}
        />,
        <ExtraContent key="extra-content" />
      ]}
    >
      <div className="play-ground">
        <div className="chat">
          <GroundEmbedding
            ref={groundLeftRef}
            modelList={modelList}
            loaded={loaded}
          ></GroundEmbedding>
        </div>
      </div>
    </PageContainerInner>
  );
};

export default PlaygroundEmbedding;
