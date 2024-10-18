import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import { ClearOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
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
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import InputList from './input-list';
import MessageInput from './message-input';
import ReferenceParams from './reference-params';
import RerankMessage from './rerank-message';
import RerankerParams from './reranker-params';
import ViewRerankCode from './view-rerank-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundReranker: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const acceptType =
    '.txt, .doc, .docx, .xls, .xlsx, .csv, .md, .pdf, .eml, .msg, .ppt, .pptx, .xml, .epub, .html';
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const intl = useIntl();
  const requestSource = useRequestToken();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const currentMessageRef = useRef<any>(null);
  const inputListRef = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const [fileList, setFileList] = useState<
    { text: string; name: string; uid: number | string }[]
  >([]);

  const [textList, setTextList] = useState<
    { text: string; uid: number | string; name: string }[]
  >([
    {
      text: '',
      uid: -1,
      name: ''
    },
    {
      text: '',
      uid: -2,
      name: ''
    }
  ]);

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const {
    initialize: innitializeParams,
    updateScrollerPosition: updateDocumentScrollerPosition
  } = useOverlayScroller();

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

      contentRef.current = current?.content || '';

      const documentList: any[] = [...textList, ...fileList];

      const result: any = await rerankerQuery(
        {
          model: parameters.model,
          top_n: parameters.top_n,
          query: contentRef.current,
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
      const maxItem = _.maxBy(result.results || [], (item: any) =>
        Math.abs(item.relevance_score)
      );
      const maxValue = _.ceil(maxItem?.relevance_score, 2);

      setMessageList([
        {
          title: 'Results',
          role: '',
          content: result.results?.map((item: any) => {
            return {
              uid: item.index,
              text: `${item.document?.slice(0, 500) || ''}`,
              docIndex: item.index,
              title: documentList[item.index]?.name || '',
              score: item.relevance_score,
              normalizValue:
                _.round(_.round(item.relevance_score, 2) / maxValue, 2) * 100
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
    submitMessage(message);
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
  const handleAddText = () => {
    inputListRef.current?.handleAdd();
  };

  const handleTextListChange = (
    list: { text: string; uid: number | string; name: string }[]
  ) => {
    setTextList(list);
  };

  const handleClearDocuments = () => {
    setTextList([
      {
        text: '',
        uid: -1,
        name: ''
      },
      {
        text: '',
        uid: -2,
        name: ''
      }
    ]);
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
    updateScrollerPosition();
  }, [messageList]);

  useEffect(() => {
    if (textList.length + fileList.length > messageListLengthCache.current) {
      updateDocumentScrollerPosition();
    }
    messageListLengthCache.current = textList.length + fileList.length;
  }, [textList.length, fileList.length]);

  return (
    <div className="ground-left-wrapper rerank">
      <div className="ground-left">
        <div className="ground-left-footer">
          <MessageInput
            scope="reranker"
            submitIcon={<SearchOutlined className="font-size-16" />}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={true}
            shouldResetMessage={false}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            clearAll={handleClear}
            modelList={[]}
            placeholer={intl.formatMessage({
              id: 'playground.input.keyword.holder'
            })}
            tools={<span style={{ paddingLeft: 6 }}>Query</span>}
            style={{
              borderTop: 'none',
              width: 'unset',
              marginInline: 32,
              marginTop: 16,
              border: '1px solid var(--ant-color-border)',
              borderRadius: 'var(--border-radius-base)',
              paddingInline: 10
            }}
          />
        </div>
        <div className="center" ref={scroller}>
          <div className="documents">
            <div className="flex-between m-b-8 doc-header">
              <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0">
                <span>Documents</span>
              </h3>
              <div className="flex gap-20">
                {/* <UploadFile
                  handleUpdateFileList={handleUpdateFileList}
                  accept={acceptType}
                >
                  <Tooltip title={<span>Support: {acceptType}</span>}>
                    <Button
                      size="middle"
                      icon={<UploadOutlined></UploadOutlined>}
                    >
                      Upload File
                    </Button>
                  </Tooltip>
                </UploadFile> */}
                <Button size="middle" onClick={handleAddText}>
                  <PlusOutlined />
                  Add Text
                </Button>
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  size="middle"
                  onClick={handleClearDocuments}
                ></Button>
              </div>
            </div>
            <div className="docs-wrapper">
              <InputList
                ref={inputListRef}
                textList={textList}
                onChange={handleTextListChange}
              ></InputList>
              {/* <div style={{ marginTop: 8 }}>
                <FileList
                  fileList={fileList}
                  textListCount={textList.length || 0}
                  onDelete={handleDeleteFile}
                ></FileList>
              </div> */}
            </div>
          </div>
          <div>
            {messageList.length ? (
              <div className="result-header flex-center">
                <h3 className="font-size-14 m-b-0">Results</h3>
                <ReferenceParams
                  usage={tokenResult}
                  showOutput={false}
                ></ReferenceParams>
              </div>
            ) : null}
          </div>
          <div
            className="message-list-wrap"
            style={{ paddingInline: 0, paddingTop: 0 }}
          >
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
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        ref={paramsRef}
      >
        <div className="box">
          <RerankerParams
            setParams={setParams}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
      </div>

      <ViewRerankCode
        open={show}
        documentList={[...textList, ...fileList].map((item) => item.text)}
        parameters={{
          ...parameters,
          query: contentRef.current
        }}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewRerankCode>
    </div>
  );
});

export default memo(GroundReranker);
