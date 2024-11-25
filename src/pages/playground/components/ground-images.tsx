import AlertInfo from '@/components/alert-info';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import ThumbImg from '@/pages/playground/components/thumb-img';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import { FileImageOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Form } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREAT_IMAGE_API } from '../apis';
import { OpenAIViewCode } from '../config';
import { ImageParamsConfig as paramsConfig } from '../config/params-config';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const initialValues = {
  n: 1,
  size: '512x512',
  quality: 'standard',
  style: ''
};

const extraConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'quality',
    options: [
      { label: 'playground.params.standard', value: 'standard', locale: true },
      { label: 'playground.params.hd', value: 'hd', locale: true }
    ],
    label: {
      text: 'playground.params.quality',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Select',
    name: 'style',
    options: [
      { label: 'playground.params.style.vivid', value: 'vivid', locale: true },
      {
        label: 'playground.params.style.natural',
        value: 'natural',
        locale: true
      }
    ],
    label: {
      text: 'playground.params.style',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

const GroundImages: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [imageList, setImageList] = useState<
    {
      dataUrl: string;
      height: number | string;
      width: string | number;
      maxHeight: string | number;
      maxWidth: string | number;
      uid: number;
      span?: number;
      loading?: boolean;
      progress?: number;
    }[]
  >([
    // {
    //   dataUrl:
    //     'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    //   height: 'auto',
    //   width: 'auto',
    //   uid: 0,
    //   span: 12,
    //   progress: 10
    // },
    // {
    //   dataUrl:
    //     'https://gw.alipayobjects.com/zos/antfincdn/LlvErxo8H9/photo-1503185912284-5271ff81b9a8.webp',
    //   height: 'auto',
    //   width: 'auto',
    //   uid: 1,
    //   span: 12,
    //   progress: 15
    // },
    // {
    //   dataUrl:
    //     'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    //   height: 'auto',
    //   width: 'auto',
    //   uid: 3,
    //   span: 12,
    //   progress: 10
    // },
    // {
    //   dataUrl:
    //     'https://gw.alipayobjects.com/zos/antfincdn/LlvErxo8H9/photo-1503185912284-5271ff81b9a8.webp',
    //   height: 'auto',
    //   width: 'auto',
    //   uid: 4,
    //   span: 12,
    //   progress: 15
    // }
  ]);

  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const form = useRef<any>(null);

  const size = Form.useWatch('size', form.current?.form);

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();

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

  const setImageSize = useCallback(() => {
    let size: Record<string, string | number> = {
      with: 256,
      height: 256,
      span: 12
    };
    if (parameters.n === 1) {
      size.width = '100%';
      size.height = '100%';
      size.span = 24;
    }
    if (parameters.n === 2) {
      size.width = '50%';
      size.height = 256;
      size.span = 12;
    }
    if (parameters.n === 3) {
      size.width = '33%';
      size.height = 256;
      size.span = 12;
    }
    if (parameters.n === 4) {
      size.width = '25%';
      size.height = 256;
      size.span = 12;
    }
    return size;
  }, [parameters.n]);

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height']),
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      ..._.omit(parameters, ['width', 'height'])
    };
  }, [parameters]);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const handleStopConversation = () => {
    requestToken.current?.abort?.();
    setLoading(false);
  };

  const submitMessage = async (current?: { content: string }) => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      const size: any = setImageSize();
      setLoading(true);
      setMessageId();
      setCurrentPrompt(current?.content || '');

      let newImageList = Array(parameters.n)
        .fill({})
        .map((item, index: number) => {
          return {
            dataUrl: 'data:image/png;base64,',
            ...size,
            progress: 0,
            height: '100%',
            width: '100%',
            loading: true,
            uid: index
          };
        });
      setImageList(newImageList);

      requestToken.current?.abort?.();
      requestToken.current = new AbortController();

      const params = {
        stream: true,
        stream_options: {
          chunk_result: true
        },
        prompt: current?.content || currentPrompt || '',
        ..._.omitBy(finalParameters, (value: string) => !value)
      };

      const result: any = await fetchChunkedData({
        data: params,
        url: CREAT_IMAGE_API,
        signal: requestToken.current.signal
      });

      const { reader, decoder } = result;
      const imgSize = _.split(finalParameters.size, 'x');

      await readStreamData(reader, decoder, (chunk: any) => {
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: chunk?.error?.message || chunk?.message || ''
          });
          return;
        }

        chunk?.data?.forEach((item: any) => {
          const imgItem = newImageList[item.index];
          if (item.b64_json) {
            imgItem.dataUrl += item.b64_json;
          }
          newImageList[item.index] = {
            dataUrl: imgItem.dataUrl,
            height: '100%',
            width: '100%',
            maxHeight: `${imgSize[1]}px`,
            maxWidth: `${imgSize[0]}px`,
            uid: imgItem.uid,
            span: imgItem.span,
            loading: _.round(item.progress, 0) < 100,
            progress: _.round(item.progress, 0)
          };
        });
        setImageList([...newImageList]);
      });
    } catch (error) {
      // console.log('error:', error);
      requestToken.current?.abort?.();
      setImageList([]);
    } finally {
      setLoading(false);
    }
  };
  const handleClear = () => {
    if (!imageList.length) {
      return;
    }
    setMessageId();
    setImageList([]);
    setTokenResult(null);
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    const currentMessage = message.content ? message : undefined;
    submitMessage(currentMessage);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const renderExtra = useMemo(() => {
    return extraConfig.map((item: ParamsSchema) => {
      return (
        <Form.Item name={item.name} rules={item.rules} key={item.name}>
          <SealSelect
            {...item.attrs}
            options={item.options}
            label={
              item.label.isLocalized
                ? intl.formatMessage({ id: item.label.text })
                : item.label.text
            }
          ></SealSelect>
        </Form.Item>
      );
    });
  }, [extraConfig, intl]);

  const renderCustomSize = useMemo(() => {
    if (size === 'custom') {
      return (
        <div className="flex gap-10" key="custom">
          <Form.Item
            name="width"
            key="width"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  {
                    name: intl.formatMessage({ id: 'playground.params.width' })
                  }
                )
              }
            ]}
          >
            <SealInput.Number
              style={{ width: '100%' }}
              label={`${intl.formatMessage({ id: 'playground.params.width' })}(px)`}
            ></SealInput.Number>
          </Form.Item>
          <Form.Item
            name="height"
            key="height"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  {
                    name: intl.formatMessage({ id: 'playground.params.height' })
                  }
                )
              }
            ]}
          >
            <SealInput.Number
              style={{ width: '100%' }}
              label={`${intl.formatMessage({ id: 'playground.params.height' })}(px)`}
            ></SealInput.Number>
          </Form.Item>
        </div>
      );
    }
    return null;
  }, [size, intl]);

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
  }, [imageList, loading]);

  useEffect(() => {
    if (imageList.length > messageListLengthCache.current) {
      updateScrollerPosition();
    }
    messageListLengthCache.current = imageList.length;
    console.log('imageList:', imageList);
  }, [imageList.length]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div
          className="message-list-wrap"
          ref={scroller}
          style={{ paddingBottom: 16 }}
        >
          <>
            <div className="content" style={{ height: '100%' }}>
              <ThumbImg
                style={{
                  padding: 0,
                  height: '100%',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  flexWrap: 'unset',
                  alignItems: 'center'
                }}
                editable={false}
                dataList={imageList}
                loading={loading}
                responseable={true}
                gutter={[16, 16]}
                autoSize={true}
              ></ThumbImg>
              {!imageList.length && (
                <div className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper">
                  <span>
                    <FileImageOutlined className="font-size-32 text-secondary" />
                  </span>
                  <span>
                    {intl.formatMessage({ id: 'playground.params.empty.tips' })}
                  </span>
                </div>
              )}
            </div>
          </>
        </div>
        {tokenResult && (
          <div style={{ height: 40 }}>
            <AlertInfo
              type="danger"
              message={tokenResult?.errorMessage}
            ></AlertInfo>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            placeholer={intl.formatMessage({
              id: 'playground.input.prompt.holder'
            })}
            actions={[]}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!imageList.length}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            shouldResetMessage={false}
            clearAll={handleClear}
            tools={
              <span className="p-l-8 font-600">
                {intl.formatMessage({ id: 'playground.image.prompt' })}
              </span>
            }
          />
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
            ref={form}
            setParams={setParams}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
            extra={[renderCustomSize, ...renderExtra]}
          />
        </div>
      </div>

      <ViewCodeModal
        {...OpenAIViewCode.images}
        open={show}
        payLoad={{
          prompt: currentPrompt
        }}
        parameters={{
          ...finalParameters
        }}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundImages);
