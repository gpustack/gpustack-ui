import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
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
import { OpenAIViewCode, Roles, generateMessages } from '../../config';
import CompareContext from '../../config/compare-context';
import { MessageItem, ModelSelectionItem } from '../../config/types';
import useChatCompletion from '../../hooks/use-chat-completion';
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
      globalParams,
      setGlobalParams,
      setLoadingStatus,
      handleDeleteModel,
      handleApplySystemChangeToAll,
      modelFullList,
      actions
    } = useContext(CompareContext);
    const intl = useIntl();
    const isApplyToAllModels = useRef(false);
    const [systemMessage, setSystemMessage] = useState<string>('');
    const [params, setParams] = useState<Record<string, any>>({
      model: model
    });
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

    const viewCodeMessage = useMemo(() => {
      return generateMessages([
        { role: Roles.System, content: systemMessage },
        ...messageList
      ]);
    }, [messageList, systemMessage]);

    const abortFetch = () => {
      handleStopConversation();
      setLoadingStatus(instanceId, false);
    };

    const handleDelete = () => {
      handleDeleteModel(instanceId);
    };

    const handleSubmit = (currentMessage: Omit<MessageItem, 'uid'>) => {
      const currentMsg =
        currentMessage.content || currentMessage.imgs?.length
          ? currentMessage
          : undefined;

      submitMessage({
        system: systemMessage
          ? { role: Roles.System, content: systemMessage }
          : undefined,
        current: currentMsg,
        parameters: params
      });
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

    const handleCloseViewCode = () => {
      setShow(false);
    };

    const handleModelChange = (value: string) => {
      setParams({
        ...params,
        model: value
      });
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
      setParams({
        ...params,
        ...globalParams
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
              onChange={handleModelChange}
              value={params.model}
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
        <ViewCodeModal
          {...OpenAIViewCode.chat}
          open={show}
          payload={{
            messages: viewCodeMessage
          }}
          parameters={params}
          onCancel={handleCloseViewCode}
          title={intl.formatMessage({ id: 'playground.viewcode' })}
        ></ViewCodeModal>
      </div>
    );
  }
);

export default React.memo(ModelItem);
