import HotKeys from '@/config/hotkeys';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  HeaderRight,
  usePageContentStyle
} from '../../_components/page-box';
import { queryModelsList } from '../apis';
import ViewCodeButtons from '../components/view-code-buttons';
import useCollapseLayout from '../hooks/use-collapse-layout';
import '../style/play-ground.less';
import GroundVideo from './page';

const PlaygroundRerank: React.FC = () => {
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

  usePageContentStyle({ padding: 0 });

  return (
    <>
      <HeaderRight>
        <ViewCodeButtons
          activeKey=""
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          key="view-code-buttons"
        ></ViewCodeButtons>
      </HeaderRight>
      <div className="play-ground">
        <div className="chat">
          <GroundVideo
            ref={groundVideoRef}
            modelList={modelList}
            loaded={loaded}
          ></GroundVideo>
        </div>
      </div>
    </>
  );
};

export default PlaygroundRerank;
