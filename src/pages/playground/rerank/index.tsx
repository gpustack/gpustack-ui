import HotKeys from '@/config/hotkeys';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { PageContainerInner } from '../../_components/page-box';
import { queryModelsList } from '../apis';
import ViewCodeButtons from '../components/view-code-buttons';
import useCollapseLayout from '../hooks/use-collapse-layout';
import '../style/play-ground.less';
import GroundReranker from './page';

const PlaygroundRerank: React.FC = () => {
  const intl = useIntl();
  const groundRerankerRef = useRef<any>(null);
  const [rerankerModelList, setRerankerModelList] = useState<
    Global.BaseOption<string>[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useCollapseLayout({
    handler: () => {
      groundRerankerRef.current?.setCollapse?.();
    },
    triggeredRef: groundRerankerRef.current
  });

  const handleViewCode = useMemoizedFn(() => {
    groundRerankerRef.current?.viewCode?.();
  });

  const handleToggleCollapse = useMemoizedFn(() => {
    groundRerankerRef.current?.setCollapse?.();
  });

  useEffect(() => {
    const getModelListByReranker = async () => {
      try {
        const params = {
          categories: modelCategoriesMap.reranker,
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
        const [rerankerModelList] = await Promise.all([
          getModelListByReranker()
        ]);
        setRerankerModelList(rerankerModelList);
      } catch (error) {
        setLoaded(true);
      }
    };
    fetchData();
  }, []);

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      groundRerankerRef.current?.setCollapse?.();
    },
    {
      preventDefault: true
    }
  );

  return (
    <PageContainerInner
      className={classNames('playground-container chat')}
      styles={{
        containerWrapper: {
          padding: 0
        }
      }}
      rightContent={
        <ViewCodeButtons
          activeKey=""
          handleViewCode={handleViewCode}
          handleToggleCollapse={handleToggleCollapse}
          key="view-code-buttons"
        ></ViewCodeButtons>
      }
    >
      <div className="play-ground">
        <div className="chat">
          <GroundReranker
            ref={groundRerankerRef}
            modelList={rerankerModelList}
            loaded={loaded}
          ></GroundReranker>
        </div>
      </div>
    </PageContainerInner>
  );
};

export default PlaygroundRerank;
