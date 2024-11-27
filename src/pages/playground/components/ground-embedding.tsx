import AlertInfo from '@/components/alert-info';
import ScatterChart from '@/components/echarts/scatter';
import HighlightCode from '@/components/highlight-code';
import IconFont from '@/components/icon-font';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  HolderOutlined,
  PlusOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Checkbox, Segmented, Tabs } from 'antd';
import classNames from 'classnames';
import { PCA } from 'ml-pca';
import 'overlayscrollbars/overlayscrollbars.css';
import { Resizable } from 're-resizable';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { handleEmbedding } from '../apis';
import { OpenAIViewCode } from '../config';
import { ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/rerank.less';
import DynamicParams from './dynamic-params';
import FileList from './file-list';
import InputList from './input-list';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const paramsConfig: ParamsSchema[] = [];

const initialValues = {};

const GroundEmbedding: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const acceptType =
    '.txt, .doc, .docx, .xls, .xlsx, .csv, .md, .pdf, .eml, .msg, .ppt, .pptx, .xml, .epub, .html';
  const messageId = useRef<number>(0);

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
  const [outputType, setOutputType] = useState<string>('chart');
  const [outputHeight, setOutputHeight] = useState<number>(180);
  const [embeddingData, setEmbeddingData] = useState<{
    code: string;
    copyValue: string;
  }>({
    code: '',
    copyValue: ''
  });
  const [lessTwoInput, setLessTwoInput] = useState<boolean>(false);
  const multiplePasteEnable = useRef<boolean>(true);

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

  const { initialize, updateScrollerPosition: updateDocumentScrollerPosition } =
    useOverlayScroller();

  const { initialize: innitializeParams, updateScrollerPosition } =
    useOverlayScroller();
  const formRef = useRef<any>(null);

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
    const list = [...textList, ...fileList];
    return list.length < 2;
  }, [textList, fileList]);

  const generateEmbedding = useCallback(
    (embeddings: any[]) => {
      try {
        const dataList = embeddings.map((item) => {
          return item.embedding;
        });

        const pca = new PCA(dataList);
        const pcadata = pca.predict(dataList, { nComponents: 2 }).to2DArray();

        const input = [
          ...textList.map((item) => item.text).filter((item) => item),
          ...fileList.map((item) => item.text).filter((item) => item)
        ];

        const list = pcadata.map((item: number[], index: number) => {
          return {
            value: item,
            name: index + 1,
            text: input[index]
          };
        });
        setScatterData(list);
        const embeddingJson = embeddings.map((item, index) => {
          item.embedding = item.embedding.slice(0, 5);
          item.embedding.push(null);
          return item;
        });
        setEmbeddingData({
          code: JSON.stringify(embeddingJson, null, 2).replace(/null/g, '...'),
          copyValue: JSON.stringify(embeddings, null, 2)
        });
      } catch (e) {
        console.log('error:', e);
      }
    },
    [textList, fileList]
  );

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const handleStopConversation = () => {
    requestToken.current?.cancel?.();
    setLoading(false);
  };

  const submitMessage = async (current?: { role: string; content: string }) => {
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;

    try {
      const validTextList = textList.filter((item) => item.text);
      const validFileList = fileList.filter((item) => item.text);

      const inputList = [
        ...validTextList.map((item) => item.text),
        ...validFileList.map((item) => item.text)
      ];

      if (inputList.length < 2) {
        setLessTwoInput(true);

        return;
      }

      setTextList(validTextList);
      setFileList(validFileList);

      setLessTwoInput(false);
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      requestToken.current?.cancel?.();
      requestToken.current = requestSource();

      contentRef.current = current?.content || '';

      const result: any = await handleEmbedding(
        {
          model: parameters.model,
          encoding_format: 'float',
          input: inputList
        },
        {
          token: requestToken.current.token
        }
      );

      setTokenResult(result.usage);

      const embeddingsList = result.data || [];

      generateEmbedding(embeddingsList);
    } catch (error: any) {
      setTokenResult({
        error: true,
        errorMessage: error.response?.data?.error?.message
      });
    } finally {
      setLoading(false);
    }
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

  const handleScaleOutputSize = (
    e: any,
    direction: string,
    ref: any,
    d: any
  ) => {
    console.log('handleScaleOutputSize', e, direction, ref, d);
    if (d.height + outputHeight <= 300 && d.height + outputHeight >= 180) {
      setOutputHeight(d.height + outputHeight);
    }
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

  const handleOnPaste = useCallback(
    (e: any, index: number) => {
      if (!multiplePasteEnable.current) return;
      const text = e.clipboardData.getData('text');
      if (text) {
        console.log('text:', text);
        const dataLlist = text
          .split('\n')
          .map((item: string) => {
            return {
              text: item?.trim(),
              uid: inputListRef.current?.setMessageId(),
              name: ''
            };
          })
          .filter((item: any) => item.text);
        setTextList([...textList.slice(0, index), ...dataLlist]);
      }
    },
    [textList]
  );

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
    setTokenResult(null);
    setLessTwoInput(false);
  };

  const handleOutputTypeChange = (value: string) => {
    setOutputType(value);
  };

  const outputItems = useMemo(() => {
    return [
      {
        key: 'chart',
        label: 'Chart',
        children: (
          <ScatterChart
            seriesData={scatterData}
            height={outputHeight}
            width="100%"
            xAxisData={[]}
          ></ScatterChart>
        )
      },
      {
        key: 'json',
        label: 'JSON',
        children: (
          <div style={{ padding: 10, backgroundColor: '#fafafa' }}>
            <HighlightCode
              height={outputHeight - 20}
              theme="light"
              code={embeddingData.code}
              copyValue={embeddingData.copyValue}
              lang="json"
              copyable={true}
              style={{ marginBottom: 0 }}
            ></HighlightCode>
          </div>
        )
      }
    ];
  }, [outputHeight, scatterData, embeddingData]);

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
    if (textList.length + fileList.length > messageListLengthCache.current) {
      updateDocumentScrollerPosition();
    }
    messageListLengthCache.current = textList.length + fileList.length;
  }, [textList.length, fileList.length]);

  return (
    <div className="ground-left-wrapper rerank">
      <div className="ground-left">
        <div
          className="center"
          ref={scroller}
          style={{ height: 'auto', maxHeight: '100%' }}
        >
          <div className="documents">
            <div className="flex-between m-b-8 doc-header">
              <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0">
                <div className="flex gap-20">
                  <span>
                    {intl.formatMessage({
                      id: 'playground.embedding.documents'
                    })}
                  </span>
                </div>
              </h3>
              <div className="flex-center gap-10">
                <Button className="flex-center" size="middle">
                  <Checkbox
                    defaultChecked={multiplePasteEnable.current}
                    onChange={(e: any) => {
                      multiplePasteEnable.current = e.target.checked;
                    }}
                  >
                    {intl.formatMessage({
                      id: 'playground.input.multiplePaste'
                    })}
                  </Checkbox>
                </Button>
                {/* <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.input.multiplePaste'
                  })}
                >
                  <Switch
                    checkedChildren={intl.formatMessage({
                      id: 'playground.multiple.on'
                    })}
                    unCheckedChildren={intl.formatMessage({
                      id: 'playground.multiple.off'
                    })}
                    defaultChecked={multiplePasteEnable.current}
                    onChange={(checked) => {
                      multiplePasteEnable.current = checked;
                    }}
                  />
                </Tooltip> */}
                <Button size="middle" onClick={handleAddText}>
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'playground.embedding.addtext' })}
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  size="middle"
                  onClick={handleClearDocuments}
                >
                  {intl.formatMessage({ id: 'common.button.clear' })}
                </Button>
                {!loading ? (
                  <Button
                    size="middle"
                    type="primary"
                    disabled={inputEmpty}
                    onClick={handleSendMessage}
                    icon={<SendOutlined rotate={0} className="font-size-14" />}
                    style={{ width: 60 }}
                  ></Button>
                ) : (
                  <Button
                    style={{ width: 80 }}
                    size="middle"
                    type="primary"
                    onClick={handleStopConversation}
                    icon={
                      <IconFont
                        type="icon-stop1"
                        className="font-size-12"
                      ></IconFont>
                    }
                  >
                    {intl.formatMessage({ id: 'common.button.stop' })}
                  </Button>
                )}
              </div>
            </div>
            <div className="docs-wrapper">
              <InputList
                ref={inputListRef}
                textList={textList}
                onChange={handleTextListChange}
                onPaste={handleOnPaste}
              ></InputList>
              <div style={{ marginTop: 8 }}>
                <FileList
                  fileList={fileList}
                  textListCount={textList.length || 0}
                  onDelete={handleDeleteFile}
                ></FileList>
              </div>
              {lessTwoInput && (
                <AlertInfo
                  type="danger"
                  message="Please input at least two documents"
                ></AlertInfo>
              )}
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
            <div className="flex gap-20">
              <span>
                {intl.formatMessage({ id: 'playground.embedding.output' })}
              </span>
              <AlertInfo
                type="danger"
                message={tokenResult?.errorMessage}
              ></AlertInfo>
            </div>
            <Segmented
              onChange={handleOutputTypeChange}
              value={outputType}
              options={[
                {
                  label: intl.formatMessage({
                    id: 'playground.embedding.chart'
                  }),
                  value: 'chart'
                },
                { label: 'JSON', value: 'json' }
              ]}
            ></Segmented>
          </h3>
          <div className="embed-chart">
            <Resizable
              enable={{
                top: true
              }}
              defaultSize={{
                height: 180
              }}
              handleComponent={{
                top: (
                  <Button
                    size="small"
                    className="drag-handler"
                    color="default"
                    variant="filled"
                    icon={
                      <HolderOutlined
                        rotate={90}
                        style={{ fontSize: 'var(--font-size-14)' }}
                      />
                    }
                  ></Button>
                )
              }}
              maxHeight={300}
              minHeight={180}
              onResizeStop={handleScaleOutputSize}
            >
              <div
                style={{
                  border: '1px solid var(--ant-color-border)',
                  borderRadius: 'var(--border-radius-base)',
                  overflow: 'hidden',
                  width: '100%'
                }}
                className="scatter "
              >
                <Tabs
                  defaultActiveKey={outputType}
                  activeKey={outputType}
                  centered
                  renderTabBar={() => <></>}
                  items={outputItems}
                ></Tabs>
              </div>
            </Resizable>
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
          <DynamicParams
            ref={formRef}
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
        {...OpenAIViewCode.embeddings}
        open={show}
        payLoad={{
          input: [
            ...textList.map((item) => item.text).filter((item) => item),
            ...fileList.map((item) => item.text).filter((item) => item)
          ]
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

export default memo(GroundEmbedding);
