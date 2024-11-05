import ScatterChart from '@/components/echarts/scatter';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  LoadingOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { UMAP } from 'umap-js';
import { handleEmbedding } from '../apis';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import FileList from './file-list';
import InputList from './input-list';
import RerankerParams from './reranker-params';
import UploadFile from './upload-file';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const paramsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'truncate',
    label: {
      text: 'Truncate',
      isLocalized: false
    },
    options: [
      {
        label: 'None',
        value: 'none'
      },
      {
        label: 'Start',
        value: 'start'
      },
      {
        label: 'End',
        value: 'end'
      }
    ],
    rules: [
      {
        required: true,
        message: 'Please select truncate'
      }
    ]
  }
];

const initialValues = {
  truncate: 'none'
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

  const [scatterData, setScatterData] = useState<any[]>([]);

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

  const inputEmpty = useMemo(() => {
    const list = [...textList, ...fileList].filter((item) => item.text);
    return list.length < 2;
  }, [textList, fileList]);

  const generateEmbedding = (embeddings: any[]) => {
    try {
      const umap = new UMAP({
        // random() {
        //   return 0.1;
        // },
        // minDist: 0.1,
        nComponents: 2,
        nNeighbors: 1
      });

      const dataList = embeddings.map((item) => {
        return item.embedding;
      });

      const embedding = umap.fit([...dataList, ...dataList]);

      const list = embedding.map((item: number[], index: number) => {
        return {
          value: item,
          name: index + 1,
          text: `test test test test test`
        };
      });
      setScatterData(list);
    } catch (e) {
      // console.log('error:', e);
    }
  };

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

      const result: any = await handleEmbedding(
        {
          model: parameters.model,
          input: [
            ...textList.map((item) => item.text),
            ...fileList.map((item) => item.text)
          ]
        },
        {
          token: requestToken.current.token
        }
      );
      console.log('result:', result);

      setTokenResult(result.usage);

      const embeddingsList = result.data || [];

      console.log('embeddings:', embeddingsList);

      generateEmbedding(embeddingsList);
    } catch (error: any) {
      console.log('error========', error);
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
    setScatterData([]);
    setTokenResult(null);
  };

  const handleSendMessage = () => {
    submitMessage();
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
    setScatterData([]);
  };

  useEffect(() => {
    setMessageId();
    setScatterData([]);
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
      <div className="ground-left" style={{ justifyContent: 'flex-start' }}>
        <div
          className="center"
          ref={scroller}
          style={{ height: 'auto', maxHeight: '100%' }}
        >
          <div className="documents">
            <div className="flex-between m-b-8 doc-header">
              <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0">
                <span>Documents</span>
              </h3>
              <div className="flex gap-10">
                <UploadFile
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
                </UploadFile>
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
                <Button
                  size="middle"
                  type="primary"
                  disabled={inputEmpty}
                  onClick={handleSendMessage}
                >
                  {loading ? <LoadingOutlined /> : <ThunderboltOutlined />}
                  {intl.formatMessage({ id: 'common.button.run' })}
                </Button>
              </div>
            </div>
            <div className="docs-wrapper">
              <InputList
                ref={inputListRef}
                textList={textList}
                onChange={handleTextListChange}
              ></InputList>
              <div style={{ marginTop: 8 }}>
                <FileList
                  fileList={fileList}
                  textListCount={textList.length || 0}
                  onDelete={handleDeleteFile}
                ></FileList>
              </div>
            </div>
          </div>
        </div>

        <div
          className="ground-left-footer"
          style={{
            width: '100%',
            padding: '0 32px 16px'
          }}
        >
          <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-16">
            <span>Output</span>
          </h3>
          <div
            style={{
              border: '1px solid var(--ant-color-border)',
              borderRadius: 'var(--border-radius-base)',
              overflow: 'hidden',
              width: '100%'
            }}
            className="scatter"
          >
            <ScatterChart
              seriesData={scatterData}
              height={160}
              width="100%"
              xAxisData={[]}
            ></ScatterChart>
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
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
      </div>

      <ViewCodeModal
        open={show}
        apiType="embedding"
        payLoad={{
          input: [
            ...textList.map((item) => item.text),
            ...fileList.map((item) => item.text)
          ].filter((text) => text)
        }}
        parameters={{
          ...parameters
        }}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundReranker);
