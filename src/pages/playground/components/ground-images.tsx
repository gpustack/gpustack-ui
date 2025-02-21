import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import IconFont from '@/components/icon-font';
import routeCachekey from '@/config/route-cachekey';
import ThumbImg from '@/pages/playground/components/thumb-img';
import { FileImageOutlined, SwapOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREAT_IMAGE_API } from '../apis';
import { MessageItem } from '../config/types';
import { useInitImageMeta } from '../hooks/use-init-meta';
import useTextImage from '../hooks/use-text-image';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import { generateImageCode, generateOpenaiImageCode } from '../view-code/image';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundImages: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const intl = useIntl();
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const {
    handleOnValuesChange,
    handleToggleParamsStyle,
    form,
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible
  } = useInitImageMeta(props);
  const {
    loading,
    tokenResult,
    imageList,
    promptList,
    currentPrompt,
    setCurrentPrompt,
    handleClear,
    handleStopConversation,
    submitMessage
  } = useTextImage({
    scroller,
    paramsRef
  });

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

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const handleRandomPrompt = useCallback(() => {
    const randomIndex = generateNumber(0, promptList.length - 1);
    const randomPrompt = promptList[randomIndex];
    inputRef.current?.handleInputChange({
      target: {
        value: randomPrompt
      }
    });
  }, []);

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height', 'preview']),
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      ..._.omit(parameters, ['width', 'height', 'random_seed', 'preview'])
    };
  }, [parameters]);

  const viewCodeContent = useMemo(() => {
    console.log('finalParameters:', finalParameters);
    if (isOpenaiCompatible) {
      return generateOpenaiImageCode({
        api: CREAT_IMAGE_API,
        parameters: {
          ...finalParameters,
          prompt: currentPrompt
        }
      });
    }
    return generateImageCode({
      api: CREAT_IMAGE_API,
      parameters: {
        ...finalParameters,
        prompt: currentPrompt
      }
    });
  }, [finalParameters, isOpenaiCompatible, currentPrompt]);

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const handleSendMessage = async (message: Omit<MessageItem, 'uid'>) => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      submitMessage(finalParameters);
      setRouteCache(routeCachekey['/playground/text-to-image'], true);
    } catch (error) {
      // console.log('error:', error);
    } finally {
      console.log('finally---------');
      setRouteCache(routeCachekey['/playground/text-to-image'], false);
    }
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

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
                autoBgColor={false}
                editable={false}
                dataList={imageList}
                responseable={true}
                gutter={[8, 16]}
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
            ref={inputRef}
            placeholer={intl.formatMessage({
              id: 'playground.input.prompt.holder'
            })}
            actions={['clear']}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            title={
              <span className="font-600">
                {intl.formatMessage({ id: 'playground.image.prompt' })}
              </span>
            }
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!imageList.length}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            shouldResetMessage={false}
            clearAll={handleClear}
            tools={
              <>
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.image.prompt.random'
                  })}
                >
                  <Button
                    onClick={handleRandomPrompt}
                    size="middle"
                    type="text"
                    icon={<IconFont type="icon-random"></IconFont>}
                  ></Button>
                </Tooltip>
              </>
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
            parametersTitle={
              <div className="flex-between flex-center">
                <span>
                  {intl.formatMessage({ id: 'playground.parameters' })}
                </span>
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.image.params.custom.tips'
                  })}
                >
                  <Button
                    size="middle"
                    type="text"
                    icon={<SwapOutlined />}
                    onClick={handleToggleParamsStyle}
                  >
                    {isOpenaiCompatible
                      ? intl.formatMessage({
                          id: 'playground.image.params.custom'
                        })
                      : intl.formatMessage({
                          id: 'playground.image.params.openai'
                        })}
                  </Button>
                </Tooltip>
              </div>
            }
            onValuesChange={handleOnValuesChange}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
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

export default memo(GroundImages);
