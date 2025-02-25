import AlertInfo from '@/components/alert-info';
import SealInputNumber from '@/components/seal-form/input-number';
import HotKeys, { KeyMap } from '@/config/hotkeys';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Form, Input, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
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
import { rerankerQuery } from '../apis';
import { ParamsSchema } from '../config/types';
import { LLM_METAKEYS } from '../hooks/config';
import { useInitLLmMeta } from '../hooks/use-init-meta';
import '../style/ground-left.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import { generateRerankCode } from '../view-code/rerank';
import DynamicParams from './dynamic-params';
import InputList from './input-list';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const fieldConfig: ParamsSchema[] = [
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

const GroundReranker: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const messageId = useRef<number>(0);
  const intl = useIntl();
  const requestSource = useRequestToken();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const inputListRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const multiplePasteEnable = useRef<boolean>(true);
  const [isEmptyText, setIsEmptyText] = useState<boolean>(false);
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
  const [queryValue, setQueryValue] = useState<string>('');
  const selectionTextRef = useRef<any>(null);
  const [metaData, setMetaData] = useState<any>({});

  const { initialize, updateScrollerPosition: updateDocumentScrollerPosition } =
    useOverlayScroller();

  const {
    handleOnValuesChange,
    formRef,
    paramsConfig,
    initialValues,
    parameters,
    paramsRef,
    modelMeta,
    formFields
  } = useInitLLmMeta(props, {
    defaultValues: { top_n: 3 },
    defaultParamsConfig: fieldConfig,
    metaKeys: LLM_METAKEYS
  });

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
    return generateRerankCode({
      api: '/v1/rerank',
      parameters: {
        ..._.pick(parameters, ['model', ..._.split(formFields, ',')]),
        query: queryValue,
        documents: [...textList, ...fileList]
          .map((item) => item.text)
          .filter((text) => text)
      }
    });
  }, [parameters, formFields, queryValue, textList, fileList]);

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
          <Tag color={'gold'} bordered={false}>
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

  const submitMessage = async () => {
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;
    try {
      const documentList: any[] = [...textList, ...fileList];

      const validDocus = documentList.filter((item) => item.text);

      if (!validDocus.length) {
        setIsEmptyText(true);
        return;
      }
      setIsEmptyText(false);
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setSortIndexMap([]);

      requestToken.current?.cancel?.();
      requestToken.current = requestSource();

      const result: any = await rerankerQuery(
        {
          model: parameters.model,
          top_n: parameters.top_n,
          query: queryValue,
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
    } catch (error: any) {
      setTokenResult({
        error: true,
        errorMessage: error.response?.data?.error?.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    submitMessage();
  };

  const handleQueryChange = (e: any) => {
    setQueryValue(e.target.value);
  };

  const handleCloseViewCode = () => {
    setShow(false);
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

  const handleonSelect = useCallback(
    (data: {
      start: number;
      end: number;
      beforeText: string;
      afterText: string;
      index: number;
    }) => {
      selectionTextRef.current = data;
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
        dataLlist[0].text = `${selectionTextRef.current?.beforeText || ''}${dataLlist[0].text}${selectionTextRef.current?.afterText || ''}`;
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

  const renderExtra = useMemo(() => {
    if (modelMeta?.n_ctx && modelMeta?.n_slot) {
      return (
        <Form.Item>
          <SealInputNumber
            disabled
            label="Max Tokens"
            value={_.divide(modelMeta?.n_ctx, modelMeta?.n_slot)}
          ></SealInputNumber>
        </Form.Item>
      );
    }
    return null;
  }, [modelMeta]);

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
    setIsEmptyText(false);
  };

  useHotkeys(
    HotKeys.SUBMIT,
    (e: any) => {
      e.preventDefault();
      handleSearch(queryValue);
    },
    {
      enabled: !loading,
      preventDefault: true
    }
  );

  useEffect(() => {
    setMessageId();
    setTokenResult(null);
  }, [parameters.model]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

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
                  <span className="full-wrap">
                    <SendOutlined rotate={0} className="font-size-14" />
                  </span>
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
                    <QuestionCircleOutlined className="m-l-4" />
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
                onSelect={handleonSelect}
                onPaste={handleOnPaste}
              ></InputList>
              {isEmptyText && (
                <div className="m-t-16">
                  <AlertInfo
                    type="danger"
                    message={intl.formatMessage({
                      id: 'playground.documents.verify.rerank'
                    })}
                  ></AlertInfo>
                </div>
              )}
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
            onValuesChange={handleOnValuesChange}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            modelList={modelList}
            extra={renderExtra}
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

export default memo(GroundReranker);
