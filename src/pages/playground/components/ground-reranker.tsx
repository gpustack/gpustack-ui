import AlertInfo from '@/components/alert-info';
import SealInputNumber from '@/components/seal-form/input-number';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Spin,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { RERANKER_API, rerankerQuery } from '../apis';
import { extractErrorMessage } from '../config';
import { rerankerSamples } from '../config/samples';
import { ParamsSchema } from '../config/types';
import { LLM_METAKEYS } from '../hooks/config';
import { useInitLLmMeta } from '../hooks/use-init-meta';
import useRerankerResponse from '../reranker/hooks/use-reranker-response';
import '../style/ground-llm.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import { generateRerankCode } from '../view-code/rerank';
import DynamicParams from './dynamic-params';
import InputList from './input-list';
import TokenUsage from './token-usage';
import ViewCommonCode from './view-common-code';

const { Text } = Typography;

const SearchInputWrapper = styled.div`
  margin: 16px 32px 10px;
  position: relative;
`;

const ValidText = styled(Text)`
  position: absolute;
  bottom: -20px;
  left: 0;
`;

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
  const { handleSGlangResponse } = useRerankerResponse();
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
  const [isEmptyQuery, setIsEmptyQuery] = useState<boolean>(false);

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
  const [queryValue, setQueryValue] = useState<string>('');
  const selectionTextRef = useRef<any>(null);

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
  } = useInitLLmMeta(
    {
      modelList,
      isChat: true
    },
    {
      defaultValues: { top_n: 3 },
      defaultParamsConfig: fieldConfig,
      metaKeys: LLM_METAKEYS
    }
  );

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      },
      setCollapse() {
        setCollapse(!collapse);
      },
      collapse: collapse
    };
  });

  const setMessageId = () => {
    const uid = inputListRef.current?.setMessageId();
    return uid;
  };

  useEffect(() => {
    if (intl.locale || 'en-US') {
      const sample = rerankerSamples[intl.locale];
      if (sample) {
        setTextList(
          sample.documents.map((item: string, index: number) => ({
            text: item,
            uid: setMessageId(),
            name: `Document ${index + 1}`,
            percent: undefined,
            score: undefined,
            rank: undefined
          }))
        );
        setQueryValue(sample.query);
      }
    }
  }, []);

  const viewCodeContent = useMemo(() => {
    return generateRerankCode({
      api: RERANKER_API,
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

  const renderPercent = (data: any) => {
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
              backgroundImage: `linear-gradient(90deg, var(--ant-blue-5) 0%, var(--ant-blue-2) 100%)`,
              width: `${percent}%`,
              height: '4px',
              borderRadius: '2px'
            }}
          ></div>
        </div>
        <span className="flex-center hover-hidden rank-tag">
          <Tag color={'geekblue'} variant="filled">
            {intl.formatMessage({ id: 'playground.rerank.rank' })}: {data.rank}
          </Tag>
          <Tag color={'gold'} variant="filled">
            {intl.formatMessage({ id: 'playground.rerank.score' })}:{' '}
            {_.round(data.score, 2)}
          </Tag>
        </span>
      </div>
    );
  };

  const submitMessage = async (query: string) => {
    try {
      setIsEmptyQuery(!queryValue);
      setTokenResult(null);
      await formRef.current?.form.validateFields();

      if (!parameters.model || !queryValue) return;
      const documentList: any[] = [...textList, ...fileList];

      const validDocus = documentList.filter((item) => item.text);

      if (!validDocus.length) {
        setIsEmptyText(true);
        return;
      }
      setIsEmptyText(false);
      setLoading(true);
      setMessageId();

      requestToken.current?.cancel?.();
      requestToken.current = requestSource();

      const filledList = textList.filter((item) => item.text);

      setTextList(filledList);

      const res: any = await rerankerQuery(
        {
          model: parameters.model,
          top_n: parameters.top_n,
          query: query,
          documents: filledList.map((item) => item.text)
        },
        {
          token: requestToken.current.token
        }
      );

      // detect response type
      const result = Array.isArray(res) ? handleSGlangResponse(res) : res;

      setMessageId();
      setTokenResult(result.usage);

      const sortList = _.sortBy(
        result.results || [],
        (item: any) => item.relevance_score
      );
      const maxValue = sortList[sortList.length - 1].relevance_score;
      const minValue = sortList[0].relevance_score;

      // reset state
      let newTextList = filledList.map((item) => {
        item.percent = undefined;
        item.score = undefined;
        item.rank = undefined;
        return item;
      });

      result.results?.forEach((item: any, sIndex: number) => {
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
      setTextList(newTextList);
    } catch (error: any) {
      setTokenResult({
        error: true,
        errorMessage: extractErrorMessage(error.response)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val: string, event: any, action: any) => {
    if (action.source === 'clear') {
      return;
    }
    submitMessage(val);
  };

  const handleQueryChange = (e: any) => {
    setQueryValue(e.target.value);
    setIsEmptyQuery(!e.target.value);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleAddText = () => {
    inputListRef.current?.handleAdd();
  };

  const handleTextListChange = (
    list: { text: string; uid: number | string; name: string }[]
  ) => {
    const newList = list?.map((item: any) => {
      item.percent = undefined;
      item.score = undefined;
      item.rank = undefined;
      return item;
    });
    setTextList(newList);
  };

  const handleonSelect = (data: {
    start: number;
    end: number;
    beforeText: string;
    afterText: string;
    index: number;
  }) => {
    selectionTextRef.current = data;
  };

  const handleOnPaste = (e: any, index: number) => {
    if (!multiplePasteEnable.current) return;
    const text = e.clipboardData.getData('text');
    if (text) {
      const dataLlist = text.split('\n').map((item: string) => {
        return {
          text: item?.trim(),
          name: '',
          uid: setMessageId(),
          percent: undefined,
          score: undefined,
          rank: undefined
        };
      });
      dataLlist[0].text = `${selectionTextRef.current?.beforeText || ''}${dataLlist[0].text}${selectionTextRef.current?.afterText || ''}`;
      const result = [
        ...textList.slice(0, index),
        ...dataLlist,
        ...textList.slice(index + 1)
      ].filter((item) => item.text);

      setTextList(result);
    }
  };

  const renderExtra = useMemo(() => {
    if (modelMeta?.n_ctx && modelMeta?.n_slot) {
      return (
        <Form.Item>
          <SealInputNumber
            disabled
            label="Max Tokens"
            value={_.floor(_.divide(modelMeta?.n_ctx, modelMeta?.n_slot))}
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
        uid: setMessageId(),
        name: ''
      },
      {
        text: '',
        uid: setMessageId(),
        name: ''
      }
    ]);
    setFileList([]);
    setTokenResult(null);
    setIsEmptyText(false);
  };

  const onValuesChange = useCallback((changedValues: any, allValues: any) => {
    if (changedValues.model) {
      setTokenResult(null);
    }
    handleOnValuesChange(changedValues, allValues);
  }, []);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize]);

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
          <SearchInputWrapper>
            <Input.Search
              allowClear
              value={queryValue}
              onSearch={handleSearch}
              onChange={handleQueryChange}
              enterButton={
                <Tooltip
                  title={
                    <span>
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
            {isEmptyQuery && (
              <ValidText type="danger">
                {intl.formatMessage({ id: 'playground.rerank.query.validate' })}
              </ValidText>
            )}
          </SearchInputWrapper>
        </div>
        <div className="center" ref={scroller} style={{ marginTop: 16 }}>
          <div className="documents">
            <div
              className="flex-between m-b-8 doc-header"
              style={{ marginTop: 0 }}
            >
              <h3 className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0">
                <span>
                  {intl.formatMessage({ id: 'playground.embedding.documents' })}
                </span>
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
                  disabled={loading}
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
                showLabel={false}
                height={46}
                onChange={handleTextListChange}
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
              <TokenUsage
                tokenResult={tokenResult}
                className="m-t-16"
              ></TokenUsage>
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
            onValuesChange={onValuesChange}
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

export default GroundReranker;
