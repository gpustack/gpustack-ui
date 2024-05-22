import { ControlOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Popover, Select, Space } from 'antd';
import { useEffect, useState } from 'react';
import ChatContent from './components/chatContent';
import MessageInput from './components/messageInput';
import ParamsSettings from './components/params-settings';

const dataList = [
  { value: 'llama3:latest', label: 'llama3:latest' },
  { value: 'wangfuyun/AnimateLCM', label: 'wangfuyun/AnimateLCM' },
  { value: 'Revanthraja/Text_to_Vision', label: 'Revanthraja/Text_to_Vision' }
];

const Playground: React.FC = () => {
  const [ModelList, setModelList] = useState(dataList);
  const [messageList, setMessageList] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3:latest');
  const [showPopover, setShowPopover] = useState(false);

  const handleSelectChange = (value: string) => {
    setSelectedModel(value);
  };

  const getMessageList = () => {
    // fetch message list from server
    console.log('getModelList');
    setMessageList(['1']);
  };

  const handleTogglePopover = () => {
    setShowPopover(!showPopover);
  };

  const handleClosePopover = () => {
    setShowPopover(false);
  };

  useEffect(() => {
    getMessageList();
  }, [selectedModel]);

  return (
    <PageContainer
      title={false}
      extra={[
        <Space size={20} key="space">
          <Select
            showSearch
            options={ModelList}
            style={{ width: 300 }}
            value={selectedModel}
            onChange={handleSelectChange}
            variant="filled"
            key="model-select"
          ></Select>
          <Popover
            content={
              <ParamsSettings onClose={handleClosePopover}></ParamsSettings>
            }
            destroyTooltipOnHide={true}
            title="Params Settings"
            trigger="click"
            arrow={false}
            open={showPopover}
            overlayStyle={{ top: 70 }}
            overlayInnerStyle={{ paddingRight: 0 }}
            placement="bottomRight"
            key="popover"
          >
            <Button
              onClick={handleTogglePopover}
              type="primary"
              shape="circle"
              key="button"
              icon={<ControlOutlined />}
            ></Button>
          </Popover>
        </Space>
      ]}
      footer={[<MessageInput key="message" />]}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ChatContent messageList={messageList}></ChatContent>
      </div>
    </PageContainer>
  );
};

export default Playground;
