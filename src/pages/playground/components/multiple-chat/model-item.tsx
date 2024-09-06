import IconFont from '@/components/icon-font';
import {
  ClearOutlined,
  CloseOutlined,
  MoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Dropdown, Popover, Select } from 'antd';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import useChatCompletion from '../../hooks/use-chat-completion';
import '../../style/model-item.less';
import ParamsSettings from '../params-settings';
import MessageContent from './message-content';

interface ModelItemProps {
  model?: string;
  globalParams: Record<string, any>;
  setGlobalParams: (value: Record<string, any>) => void;
  modelList: Global.BaseOption<string>[];
  systemMessage: string;
  ref: any;
}

const ModelItem: React.FC<ModelItemProps> = forwardRef(
  ({ model, systemMessage, modelList, globalParams, setGlobalParams }, ref) => {
    const intl = useIntl();
    const isApplyToAllModels = useRef(false);
    const [params, setParams] = useState<Record<string, any>>({});
    // const [messageList, setMessageList] = useState<
    //   {
    //     role: 'user' | 'assistant';
    //     content: string;
    //   }[]
    // >([]);
    const { messageList, submitMessage, abortFetch, setMessageList, loading } =
      useChatCompletion(systemMessage, params);

    useImperativeHandle(ref, () => {
      return {
        submit: submitMessage,
        abortFetch,
        setMessageList,
        loading
      };
    });

    const actions = [
      {
        label: intl.formatMessage({ id: 'common.button.clear' }),
        key: 'clear',
        icon: <ClearOutlined />
      },
      {
        label: intl.formatMessage({ id: 'playground.viewcode' }),
        key: 'viewcode',
        icon: <IconFont type="icon-code" />
      }
    ];

    const handleModelChange = (value: string) => {
      setParams({
        ...params,
        model: value
      });
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

    const handleDropdownAction = ({ key }: { key: string }) => {
      console.log('key:', key);
    };

    useEffect(() => {
      console.log('globalParams:', globalParams.model, globalParams);
      setParams({
        ...params,
        ...globalParams
      });
    }, [globalParams]);

    useEffect(() => {
      return () => {
        abortFetch();
      };
    }, []);

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
          <span className="action">
            <Dropdown
              menu={{ items: actions, onSelect: handleDropdownAction }}
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
            <Button type="text" icon={<CloseOutlined />} size="small"></Button>
          </span>
        </div>
        <SimpleBar style={{ height: 'calc(100% - 46px)' }}>
          <div className="content">
            <MessageContent messageList={messageList} />
          </div>
        </SimpleBar>
      </div>
    );
  }
);

export default React.memo(ModelItem);
