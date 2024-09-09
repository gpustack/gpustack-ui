import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CompareContext from '../../config/compare-context';
import '../../style/multiple-chat.less';
import MessageInput from '../message-input';
import ActiveModels from './active-models';

interface MultiCompareProps {
  modelList: Global.BaseOption<string>[];
  spans?: number;
}

const MultiCompare: React.FC<MultiCompareProps> = ({ modelList }) => {
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>(
    {}
  );
  const [modelSelections, setModelSelections] = useState<
    Global.BaseOption<string>[]
  >([]);
  const [globalParams, setGlobalParams] = useState<Record<string, any>>({
    seed: null,
    stop: null,
    temperature: 1,
    top_p: 1,
    max_tokens: 1024
  });
  const [spans, setSpans] = useState<{
    span: number;
    count: number;
  }>({
    span: 12,
    count: 2
  });
  const modelRefs = useRef<any>({});
  const boxHeight = 'calc(100vh - 72px)';

  const isLoading = useMemo(() => {
    console.log('loadingStatus========2', loadingStatus);
    return _.keys(loadingStatus).some(
      (modelname: string) => loadingStatus[modelname]
    );
  }, [loadingStatus]);

  useEffect(() => {
    const list = modelList.slice?.(0, spans.count);
    setModelSelections(list);
  }, [modelList, spans.count]);

  useEffect(() => {
    modelRefs.current = {};
    modelSelections.forEach((item) => {
      modelRefs.current[item.value] = null;
    });
  }, [modelSelections]);

  const handleSubmit = (currentMessage: { role: string; content: string }) => {
    const modelRefList = _.keys(modelRefs.current);
    modelRefList.forEach(async (modelname: any, index: number) => {
      const ref = modelRefs.current[modelname];
      ref?.submit(currentMessage);
    });
  };

  const handleAbortFetch = () => {
    _.keys(modelRefs.current).forEach((modelname: string) => {
      const ref = modelRefs.current[modelname];
      ref?.abortFetch();
    });
  };

  const setModelRefs = useCallback(
    (modelname: string, el: React.MutableRefObject<any>) => {
      modelRefs.current[modelname] = el;
    },
    []
  );

  const handleSetLoadingStatus = (modeName: string, status: boolean) => {
    setLoadingStatus((preStatus) => {
      const newState = { ...preStatus };
      newState[modeName] = status;
      return newState;
    });
  };

  const handleClearAll = () => {
    _.keys(modelRefs.current).forEach((modelname: string) => {
      const ref = modelRefs.current[modelname];
      ref?.clear();
    });
  };

  const handleDeleteModel = (modelname: string) => {
    const newModelList = modelSelections.filter(
      (model) => model.value !== modelname
    );
    const span = Math.floor(24 / (24 / spans.span - 1));
    setSpans({
      span,
      count: spans.count
    });
    setModelSelections(newModelList);
  };

  const handleUpdateModelSelections = (list: Global.BaseOption<string>[]) => {
    // set spans.span
    const span = Math.floor(24 / list.length);
    setSpans({
      span: span < 8 ? 8 : span,
      count: spans.count
    });
    setModelSelections(list);
  };

  const handlePresetPrompt = (list: { role: string; content: string }[]) => {
    const sysMsg = list.filter((item) => item.role === 'system');
    const userMsg = list.filter((item) => item.role === 'user');
    const modelRefList = _.keys(modelRefs.current);
    modelRefList.forEach(async (modelname: any) => {
      const ref = modelRefs.current[modelname];
      ref?.presetPrompt(userMsg);
      ref?.setSystemMessage(_.get(sysMsg, '0.content', ''));
    });
  };

  return (
    <div className="multiple-chat" style={{ height: boxHeight }}>
      <div className="chat-list">
        <CompareContext.Provider
          value={{
            spans,
            globalParams,
            loadingStatus,
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
      </div>
      <div>
        <MessageInput
          loading={isLoading}
          handleSubmit={handleSubmit}
          handleAbortFetch={handleAbortFetch}
          clearAll={handleClearAll}
          setSpans={setSpans}
          setModelSelections={handleUpdateModelSelections}
          presetPrompt={handlePresetPrompt}
          modelList={modelList}
        />
      </div>
    </div>
  );
};

export default memo(MultiCompare);
