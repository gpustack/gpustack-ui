import { userAtom } from '@/atoms/user';
import { HistoryOutlined } from '@ant-design/icons';
import { AlertInfo, DeleteModal, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { parseVideoAdvancedParameters } from './advanced-parameters';
import DataForm from './forms';
import { buildVideoParameters } from './media-inputs';
import VideoResult from './video-result';
import styles from './video.module.less';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const VideoSession = forwardRef<any, MessageProps & { userId?: string }>(
  (props, ref) => {
    const { modelList } = props;

    const intl = useIntl();
    const clearRecordLabel = intl.formatMessage({
      id: 'playground.video.clearRecord'
    });
    const [show, setShow] = useState(false);
    const [viewCodeContent, setViewCodeContent] =
      useState<ReturnType<typeof generateCode>>();
    const [collapse, setCollapse] = useState(false);
    const scroller = useRef<HTMLDivElement>(null);
    const inputRef = useRef<any>(null);
    const confirmRef = useRef<any>(null);
    const previewedSeed = useRef<number>();

    const {
      loading,
      submitting,
      restoring,
      cancelling,
      generating,
      contentError,
      cacheError,
      hasCachedTask,
      restoredParameters,
      errorMessage,
      videoUrl,
      currentPrompt,
      currentJob,
      setCurrentPrompt,
      handleClearCache,
      handleRetryContent,
      handleCancel,
      handlePlaybackError,
      submitMessage
    } = useTextVideo(scroller, props.userId);
    const {
      handleOnValuesChange,
      prepareParameters,
      form,
      paramsConfig,
      initialValues,
      parameters,
      modelMeta
    } = useInitVideoMeta(
      { ...props, initialParameters: restoredParameters },
      { type: 'create' }
    );

    useEffect(() => {
      if (restoredParameters)
        inputRef.current?.handleInputChange({
          target: { value: restoredParameters.prompt || '' }
        });
    }, [restoredParameters]);
    useImperativeHandle(ref, () => {
      return {
        viewCode: handleViewCode,
        setCollapse() {
          setCollapse(!collapse);
        },
        collapse: collapse
      };
    });

    function handleViewCode() {
      if (restoring) return;
      const values = form.current?.getFieldsValue() ?? parameters;
      const advanced = parseVideoAdvancedParameters(values.advancedParameters);
      previewedSeed.current = values.random_seed ? values.seed : undefined;
      const effectiveParameters = buildVideoParameters(
        values,
        currentPrompt,
        modelMeta,
        'values' in advanced ? advanced.values : undefined
      );
      setViewCodeContent(
        generateCode({
          api: CREATE_VIDEO_API,
          parameters: effectiveParameters,
          ...(modelMeta?.video ? { videoMeta: modelMeta.video } : {})
        })
      );
      setShow(true);
    }

    const handleInputChange = (e: any) => {
      setCurrentPrompt(e.target.value);
    };

    const handleRandomPrompt = () => {
      const prompt =
        videoPromptList[Math.floor(Math.random() * videoPromptList.length)];
      inputRef.current?.handleInputChange({ target: { value: prompt } });
      inputRef.current?.focus?.();
    };

    const confirmClear = () => {
      confirmRef.current?.show({
        title: 'playground.video.clearTitle',
        content: 'playground.video.clearRecord',
        operation: 'playground.video.clearConfirm',
        okText: 'playground.video.clearRecord',
        cancelText: 'common.button.cancel',
        showSuccess: false,
        onOk: handleClearCache
      });
    };

    const handleSendMessage = async () => {
      if (
        !form.current ||
        !parameters.model ||
        submitting ||
        restoring ||
        generating ||
        !currentPrompt.trim()
      )
        return;
      let values: Record<string, any>;
      try {
        values = await form.current.validateFields();
      } catch {
        setCollapse(false);
        return;
      }
      const advanced = parseVideoAdvancedParameters(values.advancedParameters);
      if (!('values' in advanced)) return;
      if (previewedSeed.current !== values.seed)
        values = prepareParameters(values);
      previewedSeed.current = undefined;
      const built = buildVideoParameters(
        values,
        currentPrompt,
        modelMeta,
        advanced.values
      );
      await (modelMeta?.video
        ? submitMessage(built, modelMeta.video)
        : submitMessage(built));
    };

    const handleCloseViewCode = useCallback(() => {
      setShow(false);
    }, []);

    return (
      <div className={`ground-left-wrapper ${styles.page}`}>
        <div className="ground-left">
          <div
            className="message-list-wrap"
            ref={scroller}
            data-overlayscrollbars-initialize
          >
            <Flex vertical gap="small" className={styles.output}>
              {cacheError && (
                <AlertInfo
                  type="warning"
                  message={intl.formatMessage({
                    id: 'playground.video.cacheUnavailable'
                  })}
                />
              )}
              {!restoring && (
                <VideoResult
                  job={currentJob}
                  generating={generating}
                  loading={loading || submitting}
                  url={videoUrl}
                  contentError={contentError}
                  onRetryContent={handleRetryContent}
                  onPlaybackError={handlePlaybackError}
                />
              )}
            </Flex>
          </div>
          {errorMessage && (
            <div style={{ minHeight: 40 }}>
              <AlertInfo type="danger" message={errorMessage} />
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
              loading={submitting || generating || cancelling}
              disabled={
                !props.userId ||
                restoring ||
                generating ||
                cancelling ||
                submitting ||
                !parameters.model ||
                Boolean(
                  modelMeta.video && !modelMeta.video.playground_tasks?.length
                )
              }
              isEmpty={true}
              handleSubmit={handleSendMessage}
              stopLabel={intl.formatMessage({
                id: 'playground.video.cancelGeneration'
              })}
              handleAbortFetch={handleCancel}
              onInputChange={handleInputChange}
              shouldResetMessage={false}
              clearAll={confirmClear}
              tools={
                <>
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'playground.image.prompt.random'
                    })}
                  >
                    <Button
                      type="text"
                      size="middle"
                      icon={<IconFont type="icon-random" />}
                      aria-label={intl.formatMessage({
                        id: 'playground.image.prompt.random'
                      })}
                      onClick={handleRandomPrompt}
                    />
                  </Tooltip>
                  <Tooltip title={clearRecordLabel}>
                    <Button
                      type="text"
                      size="middle"
                      icon={<HistoryOutlined />}
                      aria-label={clearRecordLabel}
                      disabled={
                        !hasCachedTask || submitting || restoring || cancelling
                      }
                      onClick={confirmClear}
                    />
                  </Tooltip>
                </>
              }
            />
          </div>
        </div>
        <DeleteModal ref={confirmRef} />
        <RightContainer
          className={`${styles.controls} ${collapse ? styles.hidden : ''}`}
          collapsed={collapse}
        >
          <DataForm
            ref={form}
            onValuesChange={(changed, values) => {
              previewedSeed.current = undefined;
              handleOnValuesChange(changed, values);
            }}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            modelList={modelList}
            meta={modelMeta}
          />
        </RightContainer>
        {viewCodeContent && (
          <ViewCommonCode
            open={show}
            viewCodeContent={viewCodeContent}
            onCancel={handleCloseViewCode}
            title={intl.formatMessage({ id: 'playground.viewcode' })}
          />
        )}
      </div>
    );
  }
);

const GroundVideo = forwardRef<any, MessageProps>((props, ref) => {
  const user = useAtomValue(userAtom);
  const userId = user?.id == null ? undefined : String(user.id);
  return (
    <VideoSession
      key={userId || 'signed-out'}
      {...props}
      userId={userId}
      ref={ref}
    />
  );
});

export default GroundVideo;
