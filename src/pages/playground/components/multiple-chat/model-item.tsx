import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import {
  ClearOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Dropdown, Popover, Select, Spin } from 'antd';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { CHAT_API } from '../../apis';
import { Roles, formatMessageParams } from '../../config';
import CompareContext from '../../config/compare-context';
import { MessageItem, ModelSelectionItem } from '../../config/types';
import '../../style/model-item.less';
import ParamsSettings from '../params-settings';
import ReferenceParams from '../reference-params';
import ViewCodeModal from '../view-code-modal';
import MessageContent from './message-content';
import SystemMessage from './system-message';

interface ModelItemProps {
  model: string;
  modelList: ModelSelectionItem[];
  instanceId: symbol;
  ref: any;
}

const ModelItem: React.FC<ModelItemProps> = forwardRef(
  ({ model, modelList, instanceId }, ref) => {
    const {
      spans,
      globalParams,
      setGlobalParams,
      setLoadingStatus,
      handleDeleteModel,
      handleApplySystemChangeToAll,
      modelFullList,
      loadingStatus
    } = useContext(CompareContext);
    const intl = useIntl();
    const isApplyToAllModels = useRef(false);
    const [systemMessage, setSystemMessage] = useState<string>('');
    const [params, setParams] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const messageId = useRef<number>(0);
    const [messageList, setMessageList] = useState<MessageItem[]>([]);
    const [tokenResult, setTokenResult] = useState<any>(null);
    const [show, setShow] = useState(false);
    const contentRef = useRef<any>('');
    const controllerRef = useRef<any>(null);
    const currentMessageRef = useRef<MessageItem[]>([]);
    const modelScrollRef = useRef<any>(null);
    const messageListLengthCache = useRef<number>(0);
    const [viewCodeMessage, setViewCodeMessage] = useState<any[]>([]);

    const { initialize, updateScrollerPosition } = useOverlayScroller();

    const setMessageId = () => {
      messageId.current = messageId.current + 1;
    };

    const abortFetch = () => {
      controllerRef.current?.abort?.();
      setLoadingStatus(instanceId, false);
    };

    const joinMessage = (chunk: any) => {
      setTokenResult({
        ...(chunk?.usage ?? {})
      });

      if (!chunk || !_.get(chunk, 'choices', [].length)) {
        return;
      }

      contentRef.current =
        contentRef.current + _.get(chunk, 'choices.0.delta.content', '');

      setMessageList([
        ...messageList,
        ...currentMessageRef.current,
        {
          role: Roles.Assistant,
          content: contentRef.current,
          uid: messageId.current
        }
      ]);
    };

    const submitMessage = async (currentMessage?: Omit<MessageItem, 'uid'>) => {
      if (!params.model) return;
      try {
        setLoadingStatus(instanceId, true);
        setMessageId();

        controllerRef.current?.abort?.();
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;
        currentMessageRef.current = currentMessage
          ? [
              {
                ...currentMessage,
                uid: messageId.current
              }
            ]
          : [];
        setMessageList((preList) => {
          return [...preList, ...currentMessageRef.current];
        });
        const messages = _.map(
          [...messageList, ...currentMessageRef.current],
          (item: MessageItem) => {
            return {
              role: item.role,
              content: item.content,
              imgs: item.imgs || []
            };
          }
        );

        contentRef.current = '';
        // ====== payload =================
        const formatMessages = _.map(messages, (item: MessageItem) => {
          return {
            role: item.role,
            content: [
              {
                type: 'text',
                text: item.content
              },
              ..._.map(
                item.imgs,
                (img: { uid: string | number; dataUrl: string }) => {
                  return {
                    type: 'image_url',
                    image_url: {
                      url: img.dataUrl
                    }
                  };
                }
              )
            ]
          };
        });

        const messageParams = systemMessage
          ? [
              {
                role: Roles.System,
                content: [
                  {
                    type: 'text',
                    text: systemMessage
                  }
                ]
              },
              ...formatMessages
            ]
          : [...formatMessages];

        const finalMessageParams = formatMessageParams(messageParams);

        setViewCodeMessage(finalMessageParams);

        const chatParams = {
          messages: finalMessageParams,
          ...params,
          stream: true,
          stream_options: {
            include_usage: true
          }
        };
        // ============== payload end ================
        const result: any = await fetchChunkedData({
          data: chatParams,
          url: CHAT_API,
          signal
        });

        if (result?.error) {
          setTokenResult({
            error: true,
            errorMessage:
              result?.data?.error?.message || result?.data?.message || ''
          });
          return;
        }
        setMessageId();
        const { reader, decoder } = result;
        await readStreamData(reader, decoder, (chunk: any) => {
          if (chunk?.error) {
            setTokenResult({
              error: true,
              errorMessage: chunk?.error?.message || chunk?.message || ''
            });
            return;
          }
          joinMessage(chunk);
        });
      } catch (error) {
        // console.log('error:', error);
      } finally {
        setLoadingStatus(instanceId, false);
      }
    };

    const handleDelete = () => {
      handleDeleteModel(instanceId);
    };

    const handleSubmit = (currentMessage: Omit<MessageItem, 'uid'>) => {
      const currentMsg =
        currentMessage.content || currentMessage.imgs?.length
          ? currentMessage
          : undefined;
      submitMessage(currentMsg);
    };

    const handleApplyToAllModels = (e: any) => {
      isApplyToAllModels.current = e.target.checked;
      if (e.target.checked) {
        setGlobalParams({
          ..._.omit(params, 'model')
        });
      }
    };

    const handleOnValuesChange = useCallback(
      (changeValues: any, allValues: Record<string, any>) => {
        if (isApplyToAllModels.current) {
          setParams({
            ...params,
            ...allValues
          });
          setGlobalParams({
            ...allValues
          });
        } else {
          setParams({
            ...params,
            ...changeValues
          });
        }
      },
      [params, isApplyToAllModels.current]
    );

    const handleClearMessage = () => {
      setMessageList([]);
      setTokenResult(null);
      currentMessageRef.current = [];
    };

    const addNewMessage = (message: Omit<MessageItem, 'uid'>) => {
      setMessageId();
      setMessageList((preList) => {
        return [
          ...preList,
          {
            ...message,
            uid: messageId.current
          }
        ];
      });
    };

    const handleCloseViewCode = () => {
      setShow(false);
    };

    const handleModelChange = (value: string) => {
      setParams({
        ...params,
        model: value
      });
      handleClearMessage();
    };

    const handlePresetMessageList = (list: MessageItem[]) => {
      currentMessageRef.current = [];
      const messages = _.map(list, (item: Omit<MessageItem, 'uid'>) => {
        setMessageId();
        return {
          role: item.role,
          content: item.content,
          uid: messageId.current
        };
      });
      setTokenResult(null);
      setMessageList(messages);
    };

    const modelOptions = useMemo(() => {
      return modelFullList.filter((item) => {
        return item.type !== 'empty';
      });
    }, [modelFullList]);

    const actionItems = useMemo(() => {
      const list = [
        {
          label: intl.formatMessage({ id: 'common.button.clear' }),
          key: 'clear',
          icon: <ClearOutlined />,
          danger: false,
          onClick: () => {
            setMessageList([]);
            setSystemMessage('');
          }
        },
        {
          label: intl.formatMessage({ id: 'playground.viewcode' }),
          key: 'viewcode',
          icon: <IconFont type="icon-code" />,
          onClick: () => {
            setShow(true);
          }
        }
      ];

      if (modelList.length > 2) {
        list.push({
          label: intl.formatMessage({ id: 'common.button.delete' }),
          key: 'delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => {
            handleDelete();
          }
        });
      }
      return list;
    }, [modelList, intl]);

    useEffect(() => {
      setParams({
        ...params,
        model: model,
        ...globalParams
      });
    }, [globalParams, model]);

    useEffect(() => {
      return () => {
        abortFetch();
      };
    }, []);

    useEffect(() => {
      if (modelScrollRef.current) {
        initialize(modelScrollRef.current);
      }
    }, [modelScrollRef.current, initialize]);

    useEffect(() => {
      if (loadingStatus[instanceId]) {
        updateScrollerPosition();
      }
    }, [messageList]);

    useEffect(() => {
      if (messageList.length > messageListLengthCache.current) {
        updateScrollerPosition();
      }
      messageListLengthCache.current = messageList.length;
    }, [messageList.length]);

    useImperativeHandle(ref, () => {
      return {
        submit: handleSubmit,
        abortFetch,
        addNewMessage,
        clear: handleClearMessage,
        presetPrompt: handlePresetMessageList,
        setSystemMessage,
        loading
      };
    });

    return (
      <div className="model-item">
        <div className="header">
          <span className="title">
            <Select
              style={{ width: '100%' }}
              variant="borderless"
              options={modelFullList}
              onChange={handleModelChange}
              value={params.model}
              optionRender={(data) => {
                return (
                  <AutoTooltip
                    title={data.label}
                    ghost
                    tooltipProps={{
                      placement: 'right'
                    }}
                  >
                    {data.label}
                  </AutoTooltip>
                );
              }}
            ></Select>
          </span>
          <ReferenceParams usage={tokenResult} scaleable></ReferenceParams>
          <span className="action">
            <Dropdown
              menu={{
                items: actionItems
              }}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined style={{ fontSize: '14px' }} />}
                size="small"
              ></Button>
            </Dropdown>
            <Popover
              placement="bottomRight"
              content={
                <ParamsSettings
                  showModelSelector={false}
                  setParams={setParams}
                  modelList={modelList}
                  globalParams={globalParams}
                  selectedModel={params.model}
                  onValuesChange={handleOnValuesChange}
                />
              }
              trigger={['click']}
              arrow={false}
              fresh={true}
              title={
                <div>
                  <Checkbox onChange={handleApplyToAllModels}>
                    {intl.formatMessage({
                      id: 'playground.compare.applytoall'
                    })}
                  </Checkbox>
                </div>
              }
            >
              <Button
                type="text"
                icon={<SettingOutlined />}
                size="small"
              ></Button>
            </Popover>
          </span>
        </div>
        <SystemMessage
          showApplyToAll={true}
          systemMessage={systemMessage}
          applyToAll={handleApplySystemChangeToAll}
          setSystemMessage={setSystemMessage}
        ></SystemMessage>
        <div className="content" ref={modelScrollRef}>
          <div>
            <MessageContent
              spans={spans}
              messageList={messageList}
              setMessageList={setMessageList}
              editable={true}
            />
            <Spin
              spinning={!!loadingStatus[instanceId]}
              size="small"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <ViewCodeModal
          open={show}
          messageList={viewCodeMessage}
          parameters={params}
          onCancel={handleCloseViewCode}
          title={intl.formatMessage({ id: 'playground.viewcode' })}
        ></ViewCodeModal>
      </div>
    );
  }
);

export default React.memo(ModelItem);
