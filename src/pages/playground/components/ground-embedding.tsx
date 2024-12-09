import AlertInfo from '@/components/alert-info';
import ScatterChart from '@/components/echarts/scatter';
import HighlightCode from '@/components/highlight-code';
import IconFont from '@/components/icon-font';
import HotKeys, { KeyMap } from '@/config/hotkeys';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  HolderOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Checkbox, Segmented, Tabs, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
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
import { useHotkeys } from 'react-hotkeys-hook';
import { handleEmbedding } from '../apis';
import { ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/rerank.less';
import { generateEmbeddingCode } from '../view-code/embedding';
import DynamicParams from './dynamic-params';
import FileList from './file-list';
import InputList from './input-list';
import ViewCommonCode from './view-common-code';

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
  const resizeRef = useRef<any>(null);
  const resizeMaxHeight = 400;

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

  const viewCodeContent = useMemo(() => {
    return generateEmbeddingCode({
      api: '/v1-openai/embeddings',
      parameters: {
        ...parameters,
        input: [
          ...textList.map((item) => item.text).filter((item) => item),
          ...fileList.map((item) => item.text).filter((item) => item)
        ]
      }
    });
  }, [parameters, textList, fileList]);

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
        const embeddingJson = embeddings.map((o, index) => {
          const item = _.cloneDeep(o);
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
    if (
      d.height + outputHeight <= resizeMaxHeight &&
      d.height + outputHeight >= 180
    ) {
      setOutputHeight(d.height + outputHeight);
    }
  };

  const handleScaleResize = () => {
    console.log('handleScaleResize', resizeRef.current);
    const height = resizeRef.current?.state?.height;
    if (height) {
      setOutputHeight(height);
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
        const currentContent = textList[index].text;
        const dataLlist = text.split('\n').map((item: string) => {
          return {
            text: item?.trim(),
            uid: inputListRef.current?.setMessageId(),
            name: ''
          };
        });
        dataLlist[0].text = currentContent + dataLlist[0].text;
        const result = [
          ...textList.slice(0, index),
          ...dataLlist,
          ...textList.slice(index + 1)
        ]
          .filter((item) => item.text)
          .map((item, index) => {
            return {
              ...item,
              uid: inputListRef.current?.setMessageId()
            };
          });
        setTextList(result);
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
    setEmbeddingData({
      code: '',
      copyValue: ''
    });
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

  useHotkeys(
    HotKeys.SUBMIT,
    (e: any) => {
      e.preventDefault();
      handleSendMessage();
    },
    {
      enabled: !loading,
      preventDefault: true
    }
  );

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
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.input.multiplePaste.tips'
                  })}
                >
                  <Checkbox
                    defaultChecked={multiplePasteEnable.current}
                    onChange={(e: any) => {
                      multiplePasteEnable.current = e.target.checked;
                    }}
                  >
                    {intl.formatMessage({
                      id: 'playground.input.multiplePaste'
                    })}
                    <InfoCircleOutlined className="m-l-4" />
                  </Checkbox>
                </Tooltip>

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
                  <Tooltip
                    title={
                      <span>
                        [{KeyMap.SUBMIT.textKeybinding}]{' '}
                        {intl.formatMessage({ id: 'common.button.submit' })}
                      </span>
                    }
                  >
                    <Button
                      size="middle"
                      type="primary"
                      disabled={inputEmpty}
                      onClick={handleSendMessage}
                      icon={
                        <SendOutlined rotate={0} className="font-size-14" />
                      }
                      style={{ width: 60 }}
                    ></Button>
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={intl.formatMessage({ id: 'common.button.stop' })}
                  >
                    <Button
                      style={{ width: 60 }}
                      size="middle"
                      type="primary"
                      onClick={handleStopConversation}
                      icon={
                        <IconFont
                          type="icon-stop1"
                          className="font-size-12"
                        ></IconFont>
                      }
                    ></Button>
                  </Tooltip>
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
                  message={intl.formatMessage({
                    id: 'playground.documents.verify.embedding'
                  })}
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
              <span className="flex-center">
                {intl.formatMessage({ id: 'playground.embedding.output' })}
                <Tooltip
                  title={
                    <span className="flex-column">
                      <span>
                        1.
                        {intl.formatMessage({
                          id: 'playground.embedding.pcatips1'
                        })}
                      </span>
                      <span>
                        2.{' '}
                        {intl.formatMessage({
                          id: 'playground.embedding.pcatips2'
                        })}
                      </span>
                    </span>
                  }
                >
                  <InfoCircleOutlined className="m-l-4" />
                </Tooltip>
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
              ref={resizeRef}
              enable={{
                top: true
              }}
              defaultSize={{
                height: 180
              }}
              handleComponent={{
                top: (
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'playground.embedding.handler.tips'
                    })}
                  >
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
                  </Tooltip>
                )
              }}
              maxHeight={resizeMaxHeight}
              minHeight={180}
              onResize={handleScaleResize}
              onResizeStop={handleScaleOutputSize}
            >
              <div
                style={{
                  border: '1px solid var(--ant-color-border)',
                  borderRadius: 'var(--border-radius-base)',
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
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCommonCode>
    </div>
  );
});

export default memo(GroundEmbedding);
