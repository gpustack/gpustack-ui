import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import OverlayScroller from '@/components/overlay-scroller';
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
import { Roles, generateMessagesByListContent } from '../../config';
import CompareContext from '../../config/compare-context';
import { ChatParamsConfig } from '../../config/params-config';
import { MessageItem, ModelSelectionItem } from '../../config/types';
import { LLM_METAKEYS, llmInitialValues } from '../../hooks/config';
import useChatCompletion from '../../hooks/use-chat-completion';
import { useInitLLmMeta } from '../../hooks/use-init-meta';
import '../../style/model-item.less';
import { generateLLMCode } from '../../view-code/llm';
import DynamicParams from '../dynamic-params';
import ReferenceParams from '../reference-params';
import ViewCommonCode from '../view-common-code';
import MessageContent from './message-content';
import SystemMessage from './system-message';

interface ModelItemProps {
  model: string;
  modelList: ModelSelectionItem[];
  instanceId: symbol;
  ref: any;
}

const ModelItem: React.FC<ModelItemProps> = forwardRef((props, ref) => {
  const { modelList, model, instanceId } = props;
  const {
    globalParams,
    setGlobalParams,
    setLoadingStatus,
    handleDeleteModel,
    handleApplySystemChangeToAll,
    modelFullList,
    actions
  } = useContext(CompareContext);
  const {
    handleOnValuesChange,
    handleOnModelChange,
    setParams,
    setInitialValues,
    formRef,
    paramsConfig,
    initialValues,
    parameters
  } = useInitLLmMeta(props, {
    defaultValues: {
      ...llmInitialValues,
      model: model
    },
    defaultParamsConfig: ChatParamsConfig,
    metaKeys: LLM_METAKEYS
  });
  const intl = useIntl();
  const isApplyToAllModels = useRef(false);
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [show, setShow] = useState(false);
  const scroller = useRef<any>(null);

  const {
    submitMessage,
    handleAddNewMessage,
    handleClear,
    setMessageList,
    handleStopConversation,
    tokenResult,
    messageList,
    loading
  } = useChatCompletion(scroller);

  const viewCodeContent = useMemo(() => {
    const resultList = systemMessage
      ? [{ role: Roles.System, content: systemMessage }]
      : [];
    const list = generateMessagesByListContent([...messageList]);

    return generateLLMCode({
      api: CHAT_API,
      parameters: {
        ...parameters,
        messages: [...resultList, ...list]
      }
    });
  }, [messageList, systemMessage, parameters]);

  const abortFetch = () => {
    handleStopConversation();
    setLoadingStatus(instanceId, false);
  };

  const handleDelete = () => {
    handleDeleteModel(instanceId);
  };

  const generateValidMessage = (message: Omit<MessageItem, 'uid'>) => {
    if (!message.content && !message.imgs?.length && !message.audio?.length) {
      return undefined;
    }
    return message;
  };

  const handleSubmit = (currentMessage: Omit<MessageItem, 'uid'>) => {
    const currentMsg = generateValidMessage(currentMessage);

    submitMessage({
      system: systemMessage
        ? { role: Roles.System, content: systemMessage }
        : undefined,
      current: currentMsg,
      parameters: parameters
    });
  };

  const handleApplyToAllModels = (e: any) => {
    isApplyToAllModels.current = e.target.checked;
    if (e.target.checked) {
      setGlobalParams({
        ..._.omit(parameters, 'model')
      });
    }
  };

  const OnValuesChange = useCallback(
    (changeValues: any, allValues: Record<string, any>) => {
      handleOnValuesChange(changeValues, {
        ...allValues,
        model: parameters.model
      });
      if (isApplyToAllModels.current) {
        setGlobalParams({
          ...allValues
        });
      }
    },
    [parameters, isApplyToAllModels.current]
  );

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const onModelChange = (value: string) => {
    handleOnModelChange(value);
    handleClear();
  };

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
    setParams((prev: any) => {
      return {
        ...prev,
        ...globalParams
      };
    });
    setInitialValues((prev: any) => {
      return {
        ...prev,
        ...globalParams
      };
    });
  }, [globalParams]);

  useEffect(() => {
    setLoadingStatus(instanceId, loading);
    return () => {
      setLoadingStatus(instanceId, false);
    };
  }, [loading]);

  useImperativeHandle(ref, () => {
    return {
      submit: handleSubmit,
      abortFetch,
      addNewMessage: handleAddNewMessage,
      clear: handleClear,
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
            onChange={onModelChange}
            value={parameters.model}
            labelRender={(data) => {
              return (
                <AutoTooltip
                  ghost
                  tooltipProps={{
                    placement: 'right'
                  }}
                  minWidth={60}
                  maxWidth={180}
                >
                  {data.label}
                </AutoTooltip>
              );
            }}
            optionRender={(data) => {
              return (
                <AutoTooltip
                  ghost
                  tooltipProps={{
                    placement: 'right'
                  }}
                  minWidth={60}
                  maxWidth={180}
                >
                  {data.label}
                </AutoTooltip>
              );
            }}
          ></Select>
        </span>
        {tokenResult && !loading && (
          <ReferenceParams usage={tokenResult} scaleable></ReferenceParams>
        )}
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
            autoAdjustOverflow={true}
            overlayInnerStyle={{ width: 375, paddingInline: 0 }}
            content={
              <OverlayScroller
                maxHeight={500}
                style={{ paddingInline: '24px' }}
                oppositeTheme={true}
              >
                <DynamicParams
                  ref={formRef}
                  onValuesChange={OnValuesChange}
                  paramsConfig={paramsConfig}
                  initialValues={initialValues}
                  showModelSelector={false}
                  parametersTitle={
                    <div className="flex-center flex-between">
                      <span>
                        {intl.formatMessage({ id: 'playground.parameters' })}
                      </span>
                      <Checkbox onChange={handleApplyToAllModels}>
                        {intl.formatMessage({
                          id: 'playground.compare.applytoall'
                        })}
                      </Checkbox>
                    </div>
                  }
                />
              </OverlayScroller>
            }
            trigger={['click']}
            arrow={false}
            fresh={true}
            title={false}
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
      <div className="content" ref={scroller}>
        <div>
          <MessageContent
            messageList={messageList}
            setMessageList={setMessageList}
            actions={actions}
            editable={true}
          />
          <Spin spinning={loading} size="small" style={{ width: '100%' }} />
        </div>
      </div>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
      ></ViewCommonCode>
    </div>
  );
});

export default React.memo(ModelItem);
