import { HEADER_HEIGHT } from '@/config/settings';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CompareContext from '../../config/compare-context';
import {
  MessageItem,
  MessageItemAction,
  ModelSelectionItem
} from '../../config/types';
import '../../style/multiple-chat.less';
import EmptyModels from '../empty-models';
import MessageInput from '../message-input';
import ActiveModels from './active-models';

type CurrentMessage = Omit<MessageItem, 'uid'>;

interface MultiCompareProps {
  modelList: (Global.BaseOption<string> & { type?: string })[];
  loaded?: boolean;
}

const MultiCompare: React.FC<MultiCompareProps> = ({ modelList, loaded }) => {
  const { initialize } = useOverlayScroller();
  const [loadingStatus, setLoadingStatus] = useState<Record<symbol, boolean>>(
    {}
  );
  const [modelSelections, setModelSelections] = useState<ModelSelectionItem[]>(
    []
  );
  const [globalParams, setGlobalParams] = useState<Record<string, any>>({});
  const [spans, setSpans] = useState<{
    span: number;
    count: number;
  }>({
    span: 12,
    count: 2
  });
  const modelsCounterMap = useRef<Record<string, number>>({});
  const modelRefs = useRef<any>({});
  const chatListScrollRef = useRef<any>(null);
  const boxHeight = `calc(100vh - ${HEADER_HEIGHT}px)`;
  const [actions, setActions] = useState<MessageItemAction[]>([
    'upload',
    'delete',
    'copy',
    'edit'
  ]);

  const isLoading = useMemo(() => {
    const modelRefList = Object.getOwnPropertySymbols(loadingStatus);
    return modelRefList.some((instanceId: symbol) => loadingStatus[instanceId]);
  }, [loadingStatus]);

  const setModelCounter = (model: string) => {
    modelsCounterMap.current[model] = _.add(modelsCounterMap.current[model], 1);
    return modelsCounterMap.current[model];
  };

  const pruneInstanceSymbol = (instanceId: symbol) => {
    modelRefs.current[instanceId] = null;
    loadingStatus[instanceId] = false;
  };

  const handleSubmit = (currentMessage: CurrentMessage) => {
    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach((instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.submit(currentMessage);
    });
  };

  const handleAddMessage = (message: CurrentMessage) => {
    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach((instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.addNewMessage(message);
    });
  };

  const handleAbortFetch = () => {
    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach((instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.abortFetch();
    });
  };

  const setModelRefs = useCallback(
    (instanceId: symbol, el: React.MutableRefObject<any>) => {
      modelRefs.current[instanceId] = el;
    },
    []
  );

  const handleSetLoadingStatus = (instanceId: symbol, status: boolean) => {
    setLoadingStatus((preStatus) => {
      const newState = { ...preStatus };
      newState[instanceId] = status;
      return newState;
    });
  };

  const handleClearAll = () => {
    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach((instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.clear();
    });
  };

  const adjustSpan = () => {
    const count = spans.count - 1;
    if (spans.count === 6) {
      setSpans({
        span: 8,
        count: count
      });
    } else if (spans.count === 5) {
      setSpans({
        span: 12,
        count: count
      });
    } else if (spans.count === 4) {
      setSpans({
        span: 8,
        count: count
      });
    } else if (spans.count === 3) {
      setSpans({
        span: 12,
        count: count
      });
    }
  };

  const handleDeleteModel = (instanceId: symbol) => {
    const newModelList = modelSelections.filter(
      (model) => model.instanceId !== instanceId
    );
    pruneInstanceSymbol(instanceId);

    adjustSpan();
    setModelSelections(newModelList);
  };

  const handleUpdateModelSelections = (
    list: (Global.BaseOption<string> & { instanceId: symbol })[]
  ) => {
    const newList = list.map((item) => {
      return {
        ...item,
        uid: setModelCounter(item.value),
        instanceId: Symbol(item.value)
      };
    });
    const updateList = _.concat(modelSelections, newList);
    const span = Math.floor(24 / updateList.length);
    setSpans({
      span: span < 8 ? 8 : span,
      count: spans.count
    });
    setModelSelections(updateList);
  };

  const handleApplySystemChangeToAll = (message: string) => {
    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach((instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.setSystemMessage(message);
    });
  };

  const handlePresetPrompt = (list: { role: string; content: string }[]) => {
    const sysMsg = list.filter((item) => item.role === 'system');
    const userMsg = list.filter((item) => item.role === 'user');

    const modelRefList = Object.getOwnPropertySymbols(modelRefs.current);
    modelRefList.forEach(async (instanceId: symbol) => {
      const ref = modelRefs.current[instanceId];
      ref?.presetPrompt(userMsg);
      ref?.setSystemMessage(_.get(sysMsg, '0.content', ''));
    });
  };

  const handleUpdateModelList = (spans: { span: number; count: number }) => {
    const list = modelSelections;
    // less than count
    if (list.length < spans.count) {
      const restCount = spans.count - list.length;
      const restList = _.slice(modelList, list.length, list.length + restCount);
      const resultList = Array.from(
        { length: restCount - restList.length },
        (_, index) => {
          return {
            label: '',
            value: '',
            type: 'empty'
          };
        }
      );
      const newResultList = _.concat(restList, resultList).map((item: any) => {
        return {
          ...item,
          uid: setModelCounter(item.value || 'empty'),
          instanceId:
            item.type === 'empty' ? Symbol('empty') : Symbol(item.value)
        };
      });
      setModelSelections(_.concat(list, newResultList));
      return;
    }
    // more than count
    if (list.length > spans.count) {
      const newList = list.slice(0, spans.count);
      setModelSelections(newList);
      return;
    }
  };

  const updateLayout = (value: { span: number; count: number }) => {
    setSpans(value);
    handleUpdateModelList(value);
  };

  useEffect(() => {
    modelRefs.current = {};
    let list = _.take(modelList, spans.count);
    if (list.length < spans.count && list.length > 0) {
      const restCount = spans.count - list.length;
      const restList = Array.from({ length: restCount }, (_, index) => {
        return {
          label: '',
          value: '',
          type: 'empty'
        };
      });
      list = _.concat(list, restList);
    }
    const resultList = list.map((item: any) => {
      return {
        ...item,
        uid: setModelCounter(item.value || 'empty'),
        instanceId: item.type === 'empty' ? Symbol('empty') : Symbol(item.value)
      };
    });
    setModelSelections(resultList);
  }, [modelList]);

  useEffect(() => {
    if (chatListScrollRef.current) {
      initialize(chatListScrollRef.current);
    }
  }, [chatListScrollRef.current, initialize]);

  return (
    <div className="multiple-chat" style={{ height: boxHeight }}>
      <div className="chat-list" ref={chatListScrollRef}>
        {modelList.length > 0 ? (
          <CompareContext.Provider
            value={{
              spans,
              globalParams,
              loadingStatus,
              modelFullList: modelList,
              actions,
              handleApplySystemChangeToAll,
              setGlobalParams,
              setLoadingStatus: handleSetLoadingStatus,
              handleDeleteModel: handleDeleteModel
            }}
          >
            <ActiveModels
              spans={spans}
              modelSelections={modelSelections}
              setModelRefs={setModelRefs}
            ></ActiveModels>
          </CompareContext.Provider>
        ) : (
          loaded && (
            <EmptyModels
              style={{
                height: '100%',
                paddingBottom: 60
              }}
            ></EmptyModels>
          )
        )}
      </div>
      <div>
        <MessageInput
          loading={isLoading}
          disabled={isLoading || !modelSelections.length || !modelList.length}
          handleSubmit={handleSubmit}
          addMessage={handleAddMessage}
          handleAbortFetch={handleAbortFetch}
          clearAll={handleClearAll}
          updateLayout={updateLayout}
          setModelSelections={handleUpdateModelSelections}
          actions={['clear', 'layout', 'role', 'upload', 'add', 'paste']}
          defaultChecked={false}
          defaultSize={{
            minRows: 5,
            maxRows: 5
          }}
        />
      </div>
    </div>
  );
};

export default MultiCompare;
