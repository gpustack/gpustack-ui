import HotKeys, { KeyMap } from '@/config/hotkeys';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Checkbox, Input, Spin, Tag, Tooltip } from 'antd';
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
import { useHotkeys } from 'react-hotkeys-hook';
import { rerankerQuery } from '../apis';
import { OpenAIViewCode } from '../config';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import DynamicParams from './dynamic-params';
import InputList from './input-list';
import ViewCommonCode from './view-common-code';

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
  top_n: 3
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
  const formRef = useRef<any>(null);
  const multiplePasteEnable = useRef<boolean>(true);
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
  const [sortIndexMap, setSortIndexMap] = useState<number[]>([]);
  const queryValueRef = useRef<string>('');

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
    if (!data.showExtra || !data.percent) {
      return null;
    }
    const percent = data.percent;
    return (
      <div className="rank-wrapper">
        <div className="percent-wrapper">
          <div
            className="pregress-bar"
            style={{
              backgroundImage: `linear-gradient(90deg, #388bff 0%, #cce1ff 100%)`,
              width: `${percent}%`,
              height: '4px',
              borderRadius: '2px'
            }}
          ></div>
        </div>
        <span className="flex-center hover-hidden rank-tag">
          <Tag color={'geekblue'} bordered={false}>
            {intl.formatMessage({ id: 'playground.rerank.rank' })}: {data.rank}
          </Tag>
          <Tag color={'cyan'} bordered={false}>
            {intl.formatMessage({ id: 'playground.rerank.score' })}:{' '}
            {_.round(data.score, 2)}
          </Tag>
        </span>
      </div>
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

  const submitMessage = async (current?: { content: string }) => {
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setSortIndexMap([]);

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

      // reset state
      let newTextList = textList.map((item) => {
        item.percent = undefined;
        item.score = undefined;
        item.rank = undefined;
        return item;
      });

      let sortMap: number[] = [];

      result.results?.forEach((item: any, sIndex: number) => {
        sortMap.push(item.index);

        newTextList[item.index] = {
          ...newTextList[item.index],
          uid: setMessageId(),
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

      newTextList = _.sortBy(newTextList, 'rank');
      setSortIndexMap(sortMap);
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
              uid: setMessageId(),
              text: `${item.document?.text?.slice(0, 500) || ''}`,
              docIndex: item.index,
              title: documentList[item.index]?.name || '',
              score: item.relevance_score,
              extra: renderPercent(percent),
              normalizValue: percent
            };
          }),
          uid: setMessageId()
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

  const handleSearch = (val: string) => {
    if (!val) {
      return;
    }
    submitMessage({ content: val });
  };

  const handleQueryChange = (e: any) => {
    queryValueRef.current = e.target.value;
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

  const handleTextListChange = useCallback(
    (list: { text: string; uid: number | string; name: string }[]) => {
      const newList = list?.map((item: any) => {
        item.percent = undefined;
        item.score = undefined;
        item.rank = undefined;
        return item;
      });
      setTextList(newList);
    },
    []
  );

  const handleOnPaste = useCallback(
    (e: any, index: number) => {
      if (!multiplePasteEnable.current) return;
      const text = e.clipboardData.getData('text');
      if (text) {
        const currentContent = textList[index]?.text;
        const dataLlist = text.split('\n').map((item: string) => {
          return {
            text: item?.trim(),
            uid: setMessageId(),
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
            item.percent = undefined;
            item.score = undefined;
            item.rank = undefined;
            return {
              ...item,
              uid: setMessageId()
            };
          });
        setTextList(result);
      }
    },
    [textList]
  );

  const handleOnSort = useCallback(
    (list: { text: string; uid: number | string; name: string }[]) => {
      const newList = list?.map((item) => {
        return {
          ...item,
          uid: setMessageId()
        };
      });
      setTextList(newList);
    },
    []
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
    setTokenResult(null);
  };

  useHotkeys(
    HotKeys.SUBMIT,
    (e: any) => {
      e.preventDefault();
      handleSearch(queryValueRef.current);
    },
    {
      enabled: !loading,
      preventDefault: true
    }
  );

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
          <h3
            className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0"
            style={{ padding: '0 32px', marginTop: 16 }}
          >
            <span>{intl.formatMessage({ id: 'playground.rerank.query' })}</span>
          </h3>
          <div style={{ margin: '16px 32px 10px' }}>
            <Input.Search
              allowClear
              onSearch={handleSearch}
              onChange={handleQueryChange}
              enterButton={
                <Tooltip
                  title={
                    <span>
                      [{KeyMap.SUBMIT.textKeybinding}]{' '}
                      {intl.formatMessage({ id: 'common.button.submit' })}
                    </span>
                  }
                >
                  <SendOutlined rotate={0} className="font-size-14" />
                </Tooltip>
              }
              placeholder={intl.formatMessage({
                id: 'playground.rerank.query.holder'
              })}
            ></Input.Search>
          </div>
        </div>
        <div className="center" ref={scroller}>
          <div className="documents">
            <div className="flex-between m-b-8 doc-header">
              <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0">
                <span>
                  {intl.formatMessage({ id: 'playground.embedding.documents' })}
                </span>
              </h3>
              <span className="m-l-10 font-size-12">
                {' '}
                {tokenResult?.total_tokens && (
                  <span style={{ color: 'var(--ant-orange)' }}>
                    {intl.formatMessage({ id: 'playground.tokenusage' })}:{' '}
                    {tokenResult?.total_tokens}
                  </span>
                )}
              </span>
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
              </div>
            </div>
            <div className="docs-wrapper">
              <InputList
                key={messageId.current}
                sortIndex={sortIndexMap}
                ref={inputListRef}
                textList={textList}
                showLabel={false}
                sortable={false}
                height={46}
                onChange={handleTextListChange}
                onSort={handleOnSort}
                extra={renderPercent}
                onPaste={handleOnPaste}
              ></InputList>
            </div>
          </div>
          <div></div>
          <div
            className="message-list-wrap"
            style={{ paddingInline: 0, paddingTop: 0 }}
          >
            <>
              <div className="content">
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
          <DynamicParams
            ref={formRef}
            setParams={setParams}
            params={parameters}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
      </div>

      <ViewCommonCode
        {...OpenAIViewCode.rerank}
        open={show}
        payload={{
          documents: [...textList, ...fileList]
            .map((item) => item.text)
            .filter((text) => text)
        }}
        parameters={{
          ...parameters,
          query: contentRef.current
        }}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCommonCode>
    </div>
  );
});

export default memo(GroundReranker);
