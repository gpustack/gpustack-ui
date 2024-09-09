import IconFont from '@/components/icon-font';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import {
  ClearOutlined,
  CloseOutlined,
  MoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Input,
  Popover,
  Select
} from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { CHAT_API } from '../../apis';
import { Roles } from '../../config';
import CompareContext from '../../config/compare-context';
import '../../style/model-item.less';
import ParamsSettings from '../params-settings';
import ReferenceParams from '../reference-params';
import ViewCodeModal from '../view-code-modal';
import MessageContent from './message-content';

interface ModelItemProps {
  model: string;
  modelList: Global.BaseOption<string>[];
  ref: any;
}

interface MessageItemProps {
  role: string;
  content: string;
  uid: string | number;
}

const ModelItem: React.FC<ModelItemProps> = forwardRef(
  ({ model, modelList }, ref) => {
    const {
      spans,
      globalParams,
      setGlobalParams,
      setLoadingStatus,
      handleDeleteModel,
      loadingStatus
    } = useContext(CompareContext);
    const intl = useIntl();
    const isApplyToAllModels = useRef(false);
    const [autoSize, setAutoSize] = useState<{
      minRows: number;
      maxRows: number;
    }>({ minRows: 1, maxRows: 1 });
    const [systemMessage, setSystemMessage] = useState<string>('');
    const [params, setParams] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const messageId = useRef<number>(0);
    const [messageList, setMessageList] = useState<MessageItemProps[]>([]);
    const [tokenResult, setTokenResult] = useState<any>(null);
    const [show, setShow] = useState(false);
    const contentRef = useRef<any>('');
    const controllerRef = useRef<any>(null);
    const currentMessageRef = useRef<MessageItemProps>({} as MessageItemProps);

    const setMessageId = () => {
      messageId.current = messageId.current + 1;
    };

    const abortFetch = () => {
      controllerRef.current?.abort?.();
      setLoadingStatus(params.model, false);
    };

    const joinMessage = (chunk: any) => {
      if (!chunk) {
        return;
      }
      if (_.get(chunk, 'choices.0.finish_reason')) {
        setTokenResult({
          ...chunk?.usage
        });
        return;
      }
      contentRef.current =
        contentRef.current + _.get(chunk, 'choices.0.delta.content', '');
      console.log('currentMessage==========5', messageList);
      setMessageList([
        ...messageList,
        {
          ...currentMessageRef.current
        },
        {
          role: Roles.Assistant,
          content: contentRef.current,
          uid: messageId.current
        }
      ]);
    };

    const submitMessage = async (currentParams: {
      parameters: Record<string, any>;
      currentMessage: { role: string; content: string };
    }) => {
      console.log('currentMessage==========3', currentParams);
      const { parameters, currentMessage } = currentParams;
      if (!parameters.model) return;
      try {
        setLoadingStatus(parameters.model, true);
        setMessageId();

        controllerRef.current?.abort?.();
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;
        currentMessageRef.current = {
          ...currentMessage,
          uid: messageId.current
        };
        setMessageList((preList) => {
          return [
            ...preList,
            {
              ...currentMessageRef.current
            }
          ];
        });
        console.log('currentMessage==========4', messageList);
        const messages = _.map(
          [
            ...messageList,
            {
              ...currentMessageRef.current
            }
          ],
          (item: MessageItemProps) => {
            return {
              role: item.role,
              content: item.content
            };
          }
        );

        contentRef.current = '';
        const chatParams = {
          messages: systemMessage
            ? [
                {
                  role: Roles.System,
                  content: systemMessage
                },
                ...messages
              ]
            : [...messages],
          ...parameters,
          stream: true
        };
        const result = await fetchChunkedData({
          data: chatParams,
          url: CHAT_API,
          signal
        });

        if (!result) {
          return;
        }
        const { reader, decoder } = result;
        await readStreamData(reader, decoder, (chunk: any) => {
          joinMessage(chunk);
        });
        setLoadingStatus(params.model, false);
      } catch (error) {
        console.log('error=====', error);
        setLoadingStatus(params.model, false);
      }
    };
    const handleDropdownAction = useCallback(({ key }: { key: string }) => {
      console.log('key:', key);
      if (key === 'clear') {
        setMessageList([]);
      }
      if (key === 'viewCode') {
        setShow(true);
      }
    }, []);

    const handleSubmit = (currentMessage: {
      role: string;
      content: string;
    }) => {
      console.log('currentMessage==========2', currentMessage);
      submitMessage({ parameters: params, currentMessage });
    };

    const handleApplyToAllModels = (e: any) => {
      console.log('checkbox change:', e.target.checked);
      isApplyToAllModels.current = e.target.checked;
      if (e.target.checked) {
        setGlobalParams({
          ...params
        });
      }
    };

    const handleOnValuesChange = (
      changeValues: any,
      allValues: Record<string, any>
    ) => {
      console.log('value:', allValues, isApplyToAllModels.current);
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
    };

    const handleClearMessage = () => {
      setMessageList([]);
      setTokenResult(null);
      setSystemMessage('');
      currentMessageRef.current = {} as MessageItemProps;
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

    const handlePresetMessageList = (list: MessageItemProps[]) => {
      currentMessageRef.current = {} as MessageItemProps;
      const messages = _.map(
        list,
        (item: { role: string; content: string }) => {
          setMessageId();
          return {
            role: item.role,
            content: item.content,
            uid: messageId.current
          };
        }
      );
      setTokenResult(null);
      setMessageList(messages);
    };

    const handleDelete = () => {
      handleDeleteModel(params.model);
    };

    const handleFocus = () => {
      setAutoSize({
        minRows: 4,
        maxRows: 4
      });
    };

    const handleBlur = () => {
      setAutoSize({
        minRows: 1,
        maxRows: 1
      });
    };

    useEffect(() => {
      console.log('globalParams:', globalParams.model, globalParams);
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

    useImperativeHandle(ref, () => {
      return {
        submit: handleSubmit,
        abortFetch,
        setMessageList,
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
              variant="borderless"
              options={modelList}
              onChange={handleModelChange}
              value={params.model}
            ></Select>
          </span>
          <ReferenceParams usage={tokenResult}></ReferenceParams>
          <span className="action">
            <Dropdown
              menu={{
                items: [
                  {
                    label: intl.formatMessage({ id: 'common.button.clear' }),
                    key: 'clear',
                    icon: <ClearOutlined />,
                    onClick: () => {
                      handleDropdownAction({ key: 'clear' });
                    }
                  },
                  {
                    label: intl.formatMessage({ id: 'playground.viewcode' }),
                    key: 'viewcode',
                    icon: <IconFont type="icon-code" />,
                    onClick: () => {
                      handleDropdownAction({ key: 'viewCode' });
                    }
                  }
                ]
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
              content={
                <ParamsSettings
                  showModelSelector={false}
                  setParams={setParams}
                  globalParams={globalParams}
                  onValuesChange={handleOnValuesChange}
                />
              }
              trigger={['click']}
              arrow={false}
              fresh={true}
              title={
                <div>
                  <Checkbox onChange={handleApplyToAllModels}>
                    Apply to all models
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
            <Button
              type="text"
              icon={<CloseOutlined />}
              size="small"
              onClick={handleDelete}
            ></Button>
          </span>
        </div>
        <div>
          <Input.TextArea
            variant="filled"
            placeholder="Type system message here"
            style={{ borderRadius: '0', border: 'none' }}
            value={systemMessage}
            autoSize={autoSize}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={false}
            onChange={(e) => setSystemMessage(e.target.value)}
          ></Input.TextArea>
          <Divider style={{ margin: '0' }}></Divider>
        </div>
        <div className="content">
          <MessageContent
            spans={spans}
            messageList={messageList}
            loading={loadingStatus[params.model]}
          />
        </div>
        <ViewCodeModal
          open={show}
          systemMessage={systemMessage}
          messageList={messageList}
          parameters={params}
          onCancel={handleCloseViewCode}
          title={intl.formatMessage({ id: 'playground.viewcode' })}
        ></ViewCodeModal>
      </div>
    );
  }
);

export default React.memo(ModelItem);
