import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import { ClearOutlined, InboxOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin } from 'antd';
import classNames from 'classnames';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { rerankerQuery } from '../apis';
import { MessageItem } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import FileList from './file-list';
import InputList from './input-list';
import MessageInput from './message-input';
import ReferenceParams from './reference-params';
import RerankMessage from './rerank-message';
import RerankerParams from './reranker-params';
import UploadFile from './upload-file';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundReranker: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const intl = useIntl();
  const requestSource = useRequestToken();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const currentMessageRef = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const [fileList, setFileList] = useState<
    { text: string; name: string; uid: number | string }[]
  >([]);

  const [textList, setTextList] = useState<
    { text: string; uid: number | string; name: string }[]
  >([]);

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      },
      setCollapse() {
        setCollapse(!collapse);
      }
    };
  });

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const handleStopConversation = () => {
    requestToken.current?.cancel?.();
    setLoading(false);
  };

  const submitMessage = async (current?: { role: string; content: string }) => {
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      requestToken.current?.cancel?.();
      requestToken.current = requestSource();

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      currentMessageRef.current = current
        ? [
            {
              content: current.content,
              title: 'Query',
              uid: messageId.current
            }
          ]
        : [];

      contentRef.current = '';
      setMessageList((pre) => {
        return [...currentMessageRef.current];
      });

      const documentList: any[] = [...textList, ...fileList];
      console.log('documentList:', documentList);
      const result: any = await rerankerQuery(
        {
          model: parameters.model,
          top_n: parameters.top_n,
          query: current?.content || '',
          documents: [
            ...textList.map((item) => item.text),
            ...fileList.map((item) => item.text)
          ]
        },
        {
          token: requestToken.current.token
        }
      );
      console.log('result:', result);

      setMessageId();
      setTokenResult(result.usage);
      setMessageList([
        ...currentMessageRef.current,
        {
          title: 'Results',
          content: result.results?.map((item: any) => {
            return {
              uid: item.index,
              text: `${item.document?.text?.slice(0, 100) || ''}`,
              docIndex: item.index,
              title: documentList[item.index]?.name || '',
              score: item.relevance_score
            };
          }),
          uid: messageId.current
        }
      ]);
    } catch (error: any) {
      setTokenResult({
        error: true,
        errorMessage: error.response?.data?.error?.message
      });
    } finally {
      setLoading(false);
    }
  };
  const handleClear = () => {
    if (!messageList.length) {
      return;
    }
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    const currentMessage =
      message.content || message.imgs?.length ? message : undefined;
    submitMessage(currentMessage);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleUpdateFileList = (
    files: { text: string; name: string; uid: number | string }[]
  ) => {
    console.log('files:', files);
    setFileList((preList) => {
      return [...preList, ...files];
    });
  };

  const handleDeleteFile = (uid: number | string) => {
    setFileList((preList) => {
      return preList.filter((item) => item.uid !== uid);
    });
  };

  const handleTextListChange = (
    list: { text: string; uid: number | string; name: string }[]
  ) => {
    setTextList(list);
  };

  const handleClearDocuments = () => {
    setTextList([]);
    setFileList([]);
  };

  useEffect(() => {
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  }, [parameters.model]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [paramsRef.current, innitializeParams]);

  useEffect(() => {
    if (loading) {
      updateScrollerPosition();
    }
  }, [messageList, loading]);

  useEffect(() => {
    if (messageList.length > messageListLengthCache.current) {
      updateScrollerPosition();
    }
    messageListLengthCache.current = messageList.length;
  }, [messageList.length]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="message-list-wrap" ref={scroller}>
          <>
            <div className="content">
              <RerankMessage dataList={messageList} />
              {loading && (
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              )}
            </div>
          </>
        </div>
        {tokenResult && (
          <div style={{ height: 40 }}>
            <ReferenceParams
              usage={tokenResult}
              showOutput={false}
            ></ReferenceParams>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            scope="reranker"
            loading={loading}
            disabled={!parameters.model}
            isEmpty={true}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            clearAll={handleClear}
            modelList={modelList}
            placeholer={intl.formatMessage({
              id: 'playground.input.keyword.holder'
            })}
          />
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        style={{
          paddingBottom: 80
        }}
        ref={paramsRef}
      >
        <div className="box" style={{ padding: collapse ? 0 : '0 16px' }}>
          <RerankerParams
            setParams={setParams}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
          />
          <h3 className="m-b-20 m-l-10 flex-between flex-center font-size-14">
            <span>Documents</span>
            <Button
              type="text"
              icon={<ClearOutlined />}
              size="middle"
              onClick={handleClearDocuments}
            ></Button>
          </h3>
          <InputList
            textList={textList}
            onChange={handleTextListChange}
          ></InputList>
          <div style={{ marginTop: 8 }}>
            <FileList
              fileList={fileList}
              onDelete={handleDeleteFile}
            ></FileList>
          </div>
        </div>

        <div
          style={{
            height: collapse ? 0 : 60,
            padding: '0 10px',
            position: 'absolute',
            overflow: 'hidden',
            bottom: 20,
            left: 0,
            right: 0
          }}
        >
          <UploadFile
            handleUpdateFileList={handleUpdateFileList}
            accept=".txt, .doc, .docx, .xls, .xlsx"
          >
            <div style={{ backgroundColor: 'var(--color-fill-sider)' }}>
              <InboxOutlined className="font-size-16" />
              <span className="m-l-10">
                Click or drag file to this area to upload
              </span>
            </div>
            <span className="text-tertiary">
              support .txt, .doc, .docx, .xls, .xlsx
            </span>
          </UploadFile>
        </div>
      </div>

      <ViewCodeModal
        open={show}
        systemMessage={systemMessage}
        messageList={messageList}
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundReranker);
