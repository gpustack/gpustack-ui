import ThumbImg from '@/pages/playground/components/thumb-img';
import { FileImageOutlined } from '@ant-design/icons';
import { AlertInfo, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREAT_IMAGE_API } from '../apis';
import MessageInput from '../components/message-input';
import RightContainer from '../components/right-container';
import ViewCommonCode from '../components/view-common-code';
import useImageRouteCache from '../hooks/use-image-route-cache';
import { useInitImageMeta } from '../hooks/use-init-image';
import useTextImage from '../hooks/use-text-image';
import '../style/ground-llm.less';
import '../style/system-message-wrap.less';
import { generateImageCode } from '../view-code/image';
import DataForm from './forms';
import { buildImageParameters, normalizeImageParameters } from './parameters';
interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundImages: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const intl = useIntl();
  const setRunning = useImageRouteCache();
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const {
    handleOnValuesChange,
    setParams,
    form,
    paramsConfig,
    initialValues,
    parameters
  } = useInitImageMeta(props, {
    type: 'create'
  });
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
    onLoadingChange: setRunning,
    chunkFields: ['stream_options', 'chunk_results'],
    API: CREAT_IMAGE_API
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

  const finalParameters = normalizeImageParameters(parameters);

  const viewCodeContent = useMemo(() => {
    return generateImageCode({
      api: CREAT_IMAGE_API,
      parameters: {
        ...finalParameters,
        prompt: currentPrompt
      }
    });
  }, [finalParameters, currentPrompt]);

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const handleSendMessage = async () => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      const params = buildImageParameters(parameters, currentPrompt);
      console.log('generateParams:', params);
      setParams({
        ...parameters,
        seed: params.seed
      });

      form.current?.form?.setFieldValue('seed', params.seed);
      console.log('params:', params, parameters);
      await submitMessage(params);
    } catch (error) {
      // console.log('error:', error);
    }
  };

  const handleCloseViewCode = useCallback(() => {
    setShow(false);
  }, []);

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
                    {intl.formatMessage({
                      id: 'playground.params.empty.tips'
                    })}
                  </span>
                </div>
              )}
            </div>
          </>
        </div>
        {tokenResult && (
          <div style={{ minHeight: 40 }}>
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
            actions={[]}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            title={intl.formatMessage({ id: 'playground.image.prompt' })}
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
      <RightContainer collapsed={collapse}>
        <DataForm
          ref={form}
          onValuesChange={handleOnValuesChange}
          paramsConfig={paramsConfig}
          initialValues={initialValues}
          modelList={modelList}
        />
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

export default GroundImages;
