import useRequestToken from '@/hooks/use-request-token';
import {
  ClearOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { AlertInfo, useOverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Input, Spin, Tag, Tooltip, Typography } from 'antd';
import _ from 'lodash';
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
import InputList from '../components/input-list';
import RightContainer from '../components/right-container';
import TokenUsage from '../components/token-usage';
import ViewCommonCode from '../components/view-common-code';
import { extractErrorMessage, generateMessagesByListContent } from '../config';
import { rerankerSamples } from '../config/samples';
import { LLM_METAKEYS } from '../hooks/config';
import { useInitLLmMeta } from '../hooks/use-init-llm';
import '../style/ground-llm.less';
import '../style/rerank.less';
import '../style/system-message-wrap.less';
import { generateRerankCode } from '../view-code/rerank';
import DataForm from './forms';
import useRerankerResponse from './hooks/use-reranker-response';
import { fieldConfig } from './params-config';

const { Text } = Typography;

const SearchInputWrapper = styled.div`
  margin: 16px var(--layout-content-inlinepadding) 10px;
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
  const [isEmptyQuery, setIsEmptyQuery] = useState<boolean>(false);

  const [textList, setTextList] = useState<
    {
      content: string;
      uid: number | string;
      name: string;
      score?: number;
      showExtra?: boolean;
      imgs?: { uid: number | string; dataUrl: string }[];
      percent?: number;
      rank?: number;
      role: string;
    }[]
  >([
    {
      content: '',
      uid: -1,
      name: '',
      role: 'user'
    },
    {
      content: '',
      uid: -2,
      name: '',
      role: 'user'
    }
  ]);
  const [queryValue, setQueryValue] = useState<string>('');
  const selectionTextRef = useRef<any>(null);

  const { initialize, updateScrollerPosition: updateDocumentScrollerPosition } =
    useOverlayScroller();

  const { handleOnValuesChange, formRef, parameters, modelMeta } =
    useInitLLmMeta(
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
            content: item,
            uid: setMessageId(),
            name: `Document ${index + 1}`,
            role: 'user',
            percent: undefined,
            score: undefined,
            rank: undefined
          }))
        );
        setQueryValue(sample.query);
      }
    }
  }, []);

  const formatDocuments = (
    list: {
      content: string;
      imgs?: { uid: number | string; dataUrl: string }[];
      uid: number | string;
      name: string;
      role?: string;
    }[]
  ) => {
    const validTextList = list.filter(
      (item) => item.content || item.imgs?.length
    );

    const hasImages = validTextList.some((item) => item.imgs?.length);

    if (hasImages) {
      return generateMessagesByListContent(validTextList, true).map(
        (msg: any) => ({ content: msg.content })
      );
    }

    return validTextList.map((item) => item.content || '');
  };

  const viewCodeContent = useMemo(() => {
    return generateRerankCode({
      api: RERANKER_API,
      parameters: {
        ...parameters,
        query: queryValue,
        documents: formatDocuments(textList as any)
      }
    });
  }, [parameters, queryValue, textList]);

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
      const documentList: any[] = [...textList];

      const validDocus = documentList.filter(
        (item) => item.content || item.imgs?.length
      );

      if (!validDocus.length) {
        setIsEmptyText(true);
        return;
      }
      setIsEmptyText(false);
      setLoading(true);
      setMessageId();

      requestToken.current?.cancel?.();
      requestToken.current = requestSource();

      const filledList = textList.filter(
        (item) => item.content || item.imgs?.length
      );

      setTextList(filledList);

      const res: any = await rerankerQuery(
        {
          model: parameters.model,
          top_n: parameters.top_n,
          query: query,
          documents: formatDocuments(filledList)
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
    list: { content: string; uid: number | string; name: string }[]
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

  const handleOnUploadImage = (
    list: { uid: number | string; dataUrl: string }[],
    index: number
  ) => {
    setTextList((preList) => {
      const newList = [...preList];
      const current = newList[index];
      if (current) {
        newList[index] = {
          ...current,
          content: '',
          imgs: list.map((item) => ({
            ...item,
            width: 32,
            height: 32
          }))
        };
      }
      return newList;
    });
  };

  const handleOnDeleteImage = (
    itemUid: number | string,
    updatedImgs: { uid: number | string; dataUrl: string }[]
  ) => {
    setTextList((preList) => {
      const newList = [...preList];
      const current = newList.find((i) => i.uid === itemUid);
      if (current) {
        current.imgs = updatedImgs;
      }
      return newList;
    });
  };

  const handleOnPaste = (e: any, index: number) => {
    if (!multiplePasteEnable.current) return;
    const text = e.clipboardData.getData('text');
    if (text) {
      const dataLlist = text.split('\n').map((item: string) => {
        return {
          content: item?.trim(),
          name: '',
          uid: setMessageId(),
          role: 'user',
          percent: undefined,
          score: undefined,
          rank: undefined
        };
      });
      dataLlist[0].content = `${selectionTextRef.current?.beforeText || ''}${dataLlist[0].content}${selectionTextRef.current?.afterText || ''}`;
      const result = [
        ...textList.slice(0, index),
        ...dataLlist,
        ...textList.slice(index + 1)
      ].filter((item) => item.content || item.imgs?.length);

      setTextList(result);
    }
  };

  const handleClearDocuments = () => {
    setTextList([
      {
        content: '',
        uid: setMessageId(),
        name: '',
        role: 'user'
      },
      {
        content: '',
        uid: setMessageId(),
        name: '',
        role: 'user'
      }
    ]);
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
    if (textList.length > messageListLengthCache.current) {
      updateDocumentScrollerPosition();
    }
    messageListLengthCache.current = textList.length;
  }, [textList.length]);

  return (
    <div className="ground-left-wrapper rerank">
      <div className="ground-left">
        <div className="ground-left-footer">
          <h3
            className="m-l-10 flex-between flex-center font-size-14 line-24 m-b-0"
            style={{
              padding: '0 var(--layout-content-inlinepadding)',
              marginTop: 16
            }}
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
                onUploadImage={handleOnUploadImage}
                onPaste={handleOnPaste}
                onDeleteImage={handleOnDeleteImage}
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
      <RightContainer collapsed={collapse}>
        <DataForm
          ref={formRef}
          onValuesChange={onValuesChange}
          initialValues={{ top_n: 3 }}
          modelList={modelList}
          meta={modelMeta}
        ></DataForm>
      </RightContainer>
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
