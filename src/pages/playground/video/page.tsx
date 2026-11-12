import { VideoCameraOutlined } from '@ant-design/icons';
import { AlertInfo, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Spin, Tooltip } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREATE_VIDEO_API } from '../apis';
import MessageInput from '../components/message-input';
import RightContainer from '../components/right-container';
import ViewCommonCode from '../components/view-common-code';
import { videoPromptList } from '../config';
import { useInitVideoMeta } from '../hooks/use-init-video-meta';
import useTextVideo from '../hooks/use-text-video';
import '../style/ground-llm.less';
import '../style/system-message-wrap.less';
import { generateCode } from '../view-code/video';
import DataForm from './forms';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundVideo: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const intl = useIntl();
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const {
    handleOnValuesChange,
    form,
    paramsConfig,
    initialValues,
    parameters
  } = useInitVideoMeta(props, { type: 'create' });
  const {
    loading,
    progress,
    errorMessage,
    videoUrl,
    currentPrompt,
    setCurrentPrompt,
    handleClear,
    handleStopConversation,
    submitMessage
  } = useTextVideo(scroller);
  const showPlayer = loading || Boolean(videoUrl);

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
    const randomIndex = generateNumber(0, videoPromptList.length - 1);
    const randomPrompt = videoPromptList[randomIndex];
    inputRef.current?.handleInputChange({
      target: {
        value: randomPrompt
      }
    });
  }, []);

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

  const generateParams = () => {
    const { referenceImage, ...videoParameters } = finalParameters;
    return {
      ..._.omitBy(
        videoParameters,
        (value: unknown) => value == null || value === ''
      ),
      prompt: currentPrompt,
      ...(typeof referenceImage === 'string' && referenceImage.trim()
        ? { reference_url: referenceImage.trim() }
        : {}),
      ...(referenceImage instanceof File
        ? { input_reference: referenceImage }
        : {})
    };
  };

  const viewCodeContent = generateCode({
    api: CREATE_VIDEO_API,
    parameters: generateParams()
  });

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const handleSendMessage = async () => {
    try {
      await form.current?.form?.validateFields();
    } catch {
      return;
    }
    if (!parameters.model) return;
    await submitMessage(generateParams());
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
              {showPlayer && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 720,
                    margin: '24px auto',
                    aspectRatio: '16 / 9',
                    background: '#000',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
                  }}
                >
                  <video
                    src={videoUrl || undefined}
                    controls={Boolean(videoUrl)}
                    disablePictureInPicture
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  {loading && (
                    <Spin
                      size="middle"
                      description={`${intl.formatMessage({
                        id: 'playground.video.generating'
                      })}${progress !== undefined && progress > 0 ? ` ${progress}%` : ''}`}
                      styles={{
                        root: {
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        },
                        description: {
                          color: 'var(--ant-color-text-light-solid)',
                          textShadow: 'none'
                        }
                      }}
                    />
                  )}
                </div>
              )}
              {!showPlayer && (
                <div className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper">
                  <VideoCameraOutlined className="font-size-32 text-secondary" />
                  <span>
                    {intl.formatMessage({
                      id: 'playground.video.empty.tips'
                    })}
                  </span>
                </div>
              )}
            </div>
          </>
        </div>
        {errorMessage && (
          <div style={{ height: 40 }}>
            <AlertInfo type="danger" message={errorMessage}></AlertInfo>
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
            isEmpty={!showPlayer}
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

export default GroundVideo;
