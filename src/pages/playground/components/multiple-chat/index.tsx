import { Col, Row } from 'antd';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import '../../style/multiple-chat.less';
import MessageInput from '../message-input';
import ModelItem from './model-item';

interface MultiCompareProps {
  modelList: Global.BaseOption<string>[];
  parmasSettings?: Record<string, any>;
  spans?: number;
}

const MultiCompare: React.FC<MultiCompareProps> = ({ modelList }) => {
  const [loadingStatus, setLoadingStatus] = useState<boolean[]>([]);
  const [parmasSettings, setParamsSettings] = useState<Record<string, any>>({});
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState<
    {
      role: 'user' | 'assistant';
      content: string;
    }[]
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
  const modelRefs = useRef<any[]>([]);

  const isLoading = useMemo(() => {
    return loadingStatus.some((status) => status);
  }, [loadingStatus]);

  const modelSelections = useMemo(() => {
    const list = modelList.slice?.(0, spans.count);
    return list;
  }, [modelList, spans.count]);

  useEffect(() => {
    modelRefs.current = modelSelections.map(() => {
      return {};
    });
  }, [modelSelections]);

  const handleSubmit = (message: string) => {
    let msg: any[] = [];
    if (message) {
      msg = [
        {
          role: 'user',
          content: message
        }
      ];
    }
    modelRefs.current.forEach(async (ref, index) => {
      ref?.setMessageList((preList: any) => {
        return [...preList, ...msg];
      });
      setLoadingStatus((preStatus) => {
        const newState = [...preStatus];
        newState[index] = true;
        return newState;
      });
      await ref?.submit();
      setLoadingStatus((preStatus) => {
        const newState = [...preStatus];
        newState[index] = false;
        return newState;
      });
    });
  };

  const handleAbortFetch = () => {
    modelRefs.current.forEach((ref) => {
      ref?.abortFetch();
    });
  };

  const setModelRefs = (index: number, ref: any) => {
    modelRefs.current[index] = ref;
  };

  return (
    <div className="multiple-chat">
      <div className="chat-list">
        <Row gutter={[16, 16]} style={{ height: '100%' }}>
          {modelSelections.map((model, index) => (
            <Col span={spans.span} key={model.value}>
              <ModelItem
                ref={(el: any) => setModelRefs(index, el)}
                modelList={modelSelections}
                globalParams={{
                  ...globalParams,
                  model: model.value
                }}
                systemMessage={systemMessage}
                setGlobalParams={setGlobalParams}
              />
            </Col>
          ))}
        </Row>
      </div>
      <div>
        <MessageInput
          loading={isLoading}
          handleSubmit={handleSubmit}
          handleAbortFetch={handleAbortFetch}
          setParamsSettings={setParamsSettings}
          setSpans={setSpans}
          modelList={modelList}
        />
      </div>
    </div>
  );
};

export default memo(MultiCompare);
