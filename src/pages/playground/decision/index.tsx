import HotKeys from '@/config/hotkeys';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { HeaderRight, usePageContentStyle } from '../../_components/page-box';
import { queryModelsList } from '../apis';
import ViewCodeButtons from '../components/view-code-buttons';
import useCollapseLayout from '../hooks/use-collapse-layout';
import '../style/play-ground.less';
import GroundDecision from './page';

const PlaygroundDecision: React.FC = () => {
  const groundDecisionRef = useRef<any>(null);
  const [decisionModelList, setDecisionModelList] = useState<
    Global.BaseOption<string>[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useCollapseLayout({
    handler: () => {
      groundDecisionRef.current?.setCollapse?.();
    },
    triggeredRef: groundDecisionRef.current
  });

  const handleViewCode = useMemoizedFn(() => {
    groundDecisionRef.current?.viewCode?.();
  });

  const handleToggleCollapse = useMemoizedFn(() => {
    groundDecisionRef.current?.setCollapse?.();
  });

  useEffect(() => {
    const getModelList = async () => {
      try {
        // Filtered to the decision category, like every other playground
        // (chat → llm, rerank → reranker, …). A mislabeled deployment is a
        // data problem: fix the category on the model instead of listing
        // every model here; the selector's empty-state tips say exactly
        // that. A request against a model without /v1/systemone surfaces
        // the upstream error anyway.
        const params = {
          categories: modelCategoriesMap.decision,
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
        const [decisionModelList] = await Promise.all([getModelList()]);
        setDecisionModelList(decisionModelList);
        setLoaded(true);
      } catch (error) {
        setLoaded(true);
      }
    };
    fetchData();
  }, []);

  useHotkeys(
    HotKeys.RIGHT.join(','),
    () => {
      groundDecisionRef.current?.setCollapse?.();
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
          <GroundDecision
            ref={groundDecisionRef}
            modelList={decisionModelList}
            loaded={loaded}
          ></GroundDecision>
        </div>
      </div>
    </>
  );
};

export default PlaygroundDecision;
