import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import { ClearOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Progress, Spin, Tag } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { rerankerQuery } from '../apis';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import InputList from './input-list';
import MessageInput from './message-input';
import RerankerParams from './reranker-params';
import ViewRerankCode from './view-rerank-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const paramsConfig: ParamsSchema[] = [
  {
    type: 'InputNumber',
    name: 'top_n',
    label: {
      text: 'Top N',
      isLocalized: false
    },
    attrs: {
      min: 1
    },
    rules: [
      {
        required: true,
        message: 'Top N is required'
      }
    ]
  }
];

const initialValues = {
  top_n: 1
};

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
  const scroller = useRef<any>(null);
  const inputListRef = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const [fileList, setFileList] = useState<
    {
      text: string;
      name: string;
      uid: number | string;
      score?: number;
      showExtra?: boolean;
      percent?: number;
      rank?: number;
    }[]
  >([]);

  const [textList, setTextList] = useState<
    {
      text: string;
      uid: number | string;
      name: string;
      score?: number;
      showExtra?: boolean;
      percent?: number;
      rank?: number;
    }[]
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

  const { initialize, updateScrollerPosition: updateDocumentScrollerPosition } =
    useOverlayScroller();
  const { initialize: innitializeParams, updateScrollerPosition } =
    useOverlayScroller();

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

  // [0.1, 1.0]
  const normalizValue = (data: { min: number; max: number; value: number }) => {
    const range = [0.5, 1.0];
    const [a, b] = range;
    const { min, max, value } = data;

    if (isNaN(value) || isNaN(min) || isNaN(max) || min > max) {
      return 0;
    }
    if (min === max) {
      return 100;
    }
    const res = a + ((value - min) * (b - a)) / (max - min);
    return res * 100;
  };

  const renderPercent = useCallback((data: any) => {
    if (!data.showExtra) {
      return null;
    }
    const percent = data.percent;
    return (
      <>
        <Progress
          size={{
            height: 4
          }}
          type="line"
          status="normal"
          strokeLinecap={'square'}
          showInfo={false}
          percentPosition={{ align: 'end', type: 'outer' }}
          strokeColor={`linear-gradient(90deg, #388bff 0%, rgba(255,255,255,1) ${percent}%)`}
          trailColor="transparent"
          percent={percent}
          style={{
            position: 'absolute',
            left: 0,
            bottom: -2,
            width: 'calc(100% - 2px)',
            lineHeight: '12px',
            borderRadius: '0 0 0 6px',
            overflow: 'hidden'
          }}
        ></Progress>
        <span
          className="flex-center hover-hidden"
          style={{
            position: 'absolute',
            right: 10,
            top: 8,
            padding: '0 4px',
            backgroundColor: 'transparent',
            opacity: 0.7
          }}
        >
          <Tag color={'geekblue'}>Rank: {data.rank}</Tag>
          <Tag style={{ margin: 0 }} color={'cyan'}>
            Score: {_.round(data.score, 2)}
          </Tag>
        </span>
      </>
    );
  }, []);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
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

      setMessageId();
      setTokenResult(result.usage);

      const sortList = _.sortBy(
        result.results || [],
        (item: any) => item.relevance_score
      );
      const maxValue = sortList[sortList.length - 1].relevance_score;
      const minValue = sortList[0].relevance_score;

      let newTextList = [...textList];

      result.results?.forEach((item: any, sIndex: number) => {
        newTextList[item.index] = {
          ...newTextList[item.index],
          rank: sIndex + 1,
          score: item.relevance_score,
          showExtra: true,
          percent: normalizValue({
            min: minValue,
            max: maxValue,
            value: item.relevance_score
          })
        };
      });
      setTextList(newTextList);

      setMessageList([
        {
          title: 'Results',
          role: '',
          content: result.results?.map((item: any) => {
            const percent: number = normalizValue({
              min: minValue,
              max: maxValue,
              value: item.relevance_score
            });
            return {
              uid: item.index,
              text: `${item.document?.text?.slice(0, 500) || ''}`,
              docIndex: item.index,
              title: documentList[item.index]?.name || '',
              score: item.relevance_score,
              extra: renderPercent(percent),
              normalizValue: percent
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
            actions={[]}
            defaultSize={{
              minRows: 1,
              maxRows: 2
            }}
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
            tools={
              <span style={{ paddingLeft: 6, fontSize: 14, fontWeight: 500 }}>
                Query
              </span>
            }
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
              <div className="flex gap-10">
                <Button size="middle" onClick={handleAddText}>
                  <PlusOutlined />
                  Add Text
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  size="middle"
                  onClick={handleClearDocuments}
                >
                  {intl.formatMessage({ id: 'common.button.clear' })}
                </Button>
              </div>
            </div>
            <div className="docs-wrapper">
              <InputList
                ref={inputListRef}
                textList={textList}
                onChange={handleTextListChange}
                extra={renderPercent}
              ></InputList>
            </div>
          </div>
          <div>
            {messageList.length ? (
              <div className="result-header flex-center">
                <h3 className="font-size-14 m-b-0">Results</h3>
                {tokenResult?.total_tokens && (
                  <span style={{ color: 'var(--ant-orange)' }}>
                    {intl.formatMessage({ id: 'playground.tokenusage' })}:{' '}
                    {tokenResult?.total_tokens}
                  </span>
                )}
              </div>
            ) : null}
          </div>
          <div
            className="message-list-wrap"
            style={{ paddingInline: 0, paddingTop: 0 }}
          >
            <>
              <div className="content">
                {/*<RerankMessage dataList={messageList} />*/}
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
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
      </div>

      <ViewRerankCode
        open={show}
        documentList={[...textList, ...fileList]
          .map((item) => item.text)
          .filter((text) => text)}
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
